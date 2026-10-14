import {Injectable} from "@angular/core";
import {
    BehaviorSubject,
    Observable,
    Subject,
    catchError,
    map,
    throwError,
    timeout,
} from "rxjs";
import {UrlConstants} from "src/app/shared/services/url.constants";

export type RosbridgeConnectionState =
    | "disconnected"
    | "connecting"
    | "live"
    | "unreachable";

interface RosbridgeServiceResponse {
    op: "service_response";
    id: string;
    service: string;
    result?: boolean;
    values?: {
        value?: string;
        successful?: boolean;
        reason?: string;
    };
}

interface PendingServiceCall {
    response: Subject<RosbridgeServiceResponse>;
    message: object;
}

// A single /rosapi/get_param answered in 700 ms (p50, idle) and 963 ms (p50) max 1222 ms while
// the local STT held all four cores of the Pi (test robot 192.168.1.172, 2026-10-14). The budget
// is the upper bound of that measurement plus headroom, so one slow read cannot hang the panel.
export const PARAMETER_READ_TIMEOUT_MS = 2500;

@Injectable({
    providedIn: "root",
})
export class MicrophoneArrayRosbridgeService {
    readonly connectionState$ = new BehaviorSubject<RosbridgeConnectionState>(
        "disconnected",
    );
    readonly audioLevels$ = new BehaviorSubject<number[] | undefined>(
        undefined,
    );
    readonly voiceActivity$ = new BehaviorSubject<boolean | undefined>(
        undefined,
    );
    readonly speechDetected$ = new BehaviorSubject<boolean | undefined>(
        undefined,
    );
    readonly doaAngle$ = new BehaviorSubject<number | undefined>(undefined);

    private socket: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempt = 0;
    private requestSequence = 0;
    private shouldReconnect = false;
    private readonly pendingCalls = new Map<string, PendingServiceCall>();

    connect(): void {
        this.shouldReconnect = true;
        if (
            this.socket ||
            this.connectionState$.value === "connecting" ||
            this.connectionState$.value === "live"
        ) {
            return;
        }
        this.openSocket();
    }

    disconnect(): void {
        this.shouldReconnect = false;
        this.clearReconnectTimer();
        const socket = this.socket;
        this.socket = null;
        if (socket) {
            if (socket.readyState === WebSocket.OPEN) {
                this.sendUnsubscriptions(socket);
            }
            socket.close();
        }
        this.failPendingCalls("Rosbridge disconnected.");
        this.clearLiveValues();
        this.connectionState$.next("disconnected");
    }

    getParameter<T>(name: string): Observable<T> {
        return this.callService("/rosapi/get_param", {name}).pipe(
            catchError((error: unknown) => {
                if (
                    error instanceof Error &&
                    error.message === "Rosbridge is not connected."
                ) {
                    return throwError(
                        () =>
                            new Error(
                                "Reading " +
                                    name +
                                    " failed: Rosbridge is not connected.",
                            ),
                    );
                }
                return throwError(() => error);
            }),
            timeout({
                first: PARAMETER_READ_TIMEOUT_MS,
                with: () =>
                    throwError(
                        () =>
                            new Error(
                                "Reading " +
                                    name +
                                    " timed out after " +
                                    PARAMETER_READ_TIMEOUT_MS +
                                    " ms.",
                            ),
                    ),
            }),
            map((response) => {
                const values = response.values;
                if (values?.successful === false) {
                    throw new Error(
                        "Reading " +
                            name +
                            " was refused: " +
                            (values.reason || "no reason given"),
                    );
                }
                if (response.result === false || values == null) {
                    throw new Error(
                        "Reading " +
                            name +
                            " returned no value (rosbridge/rosapi did not answer in time).",
                    );
                }
                if (typeof values.value !== "string" || values.value === "") {
                    throw new Error(
                        "Reading " + name + " returned an empty value.",
                    );
                }
                try {
                    return JSON.parse(values.value) as T;
                } catch {
                    throw new Error(
                        "Reading " + name + " returned a malformed value.",
                    );
                }
            }),
        );
    }

    setParameter(name: string, value: unknown): Observable<void> {
        return this.callService("/rosapi/set_param", {
            name,
            value: JSON.stringify(value),
        }).pipe(
            map((response) => {
                const values = response.values;
                if (values?.successful === false) {
                    throw new Error(values.reason ?? "");
                }
                if (response.result === false || values?.successful !== true) {
                    throw new Error(
                        values?.reason || "Rosbridge parameter write failed.",
                    );
                }
            }),
        );
    }

    private openSocket(): void {
        this.connectionState$.next("connecting");
        const hostname = window.location.hostname;
        const url = `ws://${hostname}:${UrlConstants.ROSBRIDGE_WEBSOCKET_PORT}`;
        const socket = new WebSocket(url);
        this.socket = socket;

        socket.onopen = () => {
            if (socket !== this.socket) {
                return;
            }
            this.reconnectAttempt = 0;
            this.connectionState$.next("live");
            this.sendSubscriptions(socket);
            for (const pending of this.pendingCalls.values()) {
                socket.send(JSON.stringify(pending.message));
            }
        };
        socket.onmessage = (event) => {
            if (socket === this.socket) {
                this.handleMessage(event.data);
            }
        };
        socket.onerror = () => {
            if (socket === this.socket) {
                this.markUnreachable();
                socket.close();
            }
        };
        socket.onclose = () => {
            if (socket !== this.socket) {
                return;
            }
            this.socket = null;
            if (this.shouldReconnect) {
                this.markUnreachable();
                this.scheduleReconnect();
            } else {
                this.connectionState$.next("disconnected");
            }
        };
    }

    private sendSubscriptions(socket: WebSocket): void {
        this.send(socket, {
            op: "subscribe",
            id: "lvl",
            topic: "/microphone_levels",
            throttle_rate: 1000,
        });
        this.send(socket, {
            op: "subscribe",
            id: "vad",
            topic: "/voice_activity",
        });
        this.send(socket, {
            op: "subscribe",
            id: "sp",
            topic: "/speech_detected",
        });
        this.send(socket, {
            op: "subscribe",
            id: "doa",
            topic: "/doa_angle",
        });
    }

    private sendUnsubscriptions(socket: WebSocket): void {
        this.send(socket, {
            op: "unsubscribe",
            id: "lvl",
            topic: "/microphone_levels",
        });
        this.send(socket, {
            op: "unsubscribe",
            id: "vad",
            topic: "/voice_activity",
        });
        this.send(socket, {
            op: "unsubscribe",
            id: "sp",
            topic: "/speech_detected",
        });
        this.send(socket, {
            op: "unsubscribe",
            id: "doa",
            topic: "/doa_angle",
        });
    }

    private handleMessage(data: string): void {
        let message: {
            op?: string;
            id?: string;
            topic?: string;
            msg?: {data?: unknown};
        };
        try {
            message = JSON.parse(data) as typeof message;
        } catch {
            return;
        }

        if (message.op === "service_response" && message.id) {
            const pending = this.pendingCalls.get(message.id);
            if (pending) {
                this.pendingCalls.delete(message.id);
                pending.response.next(message as RosbridgeServiceResponse);
                pending.response.complete();
            }
            return;
        }
        if (message.op !== "publish") {
            return;
        }

        switch (message.topic) {
            case "/microphone_levels": {
                const dataValue = message.msg?.data;
                if (
                    Array.isArray(dataValue) &&
                    dataValue.length === 2 &&
                    dataValue.every(
                        (value) =>
                            typeof value === "number" &&
                            Number.isFinite(value) &&
                            value >= 0 &&
                            value <= 1,
                    )
                ) {
                    this.audioLevels$.next(dataValue);
                }
                break;
            }
            case "/voice_activity":
                if (typeof message.msg?.data === "boolean") {
                    this.voiceActivity$.next(message.msg.data);
                }
                break;
            case "/speech_detected":
                if (typeof message.msg?.data === "boolean") {
                    this.speechDetected$.next(message.msg.data);
                }
                break;
            case "/doa_angle":
                if (
                    typeof message.msg?.data === "number" &&
                    Number.isInteger(message.msg.data) &&
                    message.msg.data >= 0 &&
                    message.msg.data <= 359
                ) {
                    this.doaAngle$.next(message.msg.data);
                }
                break;
        }
    }

    private callService(
        service: "/rosapi/get_param" | "/rosapi/set_param",
        args: object,
    ): Observable<RosbridgeServiceResponse> {
        const id = `microphone-${++this.requestSequence}`;
        const response = new Subject<RosbridgeServiceResponse>();
        const message = {op: "call_service", id, service, args};
        this.pendingCalls.set(id, {response, message});

        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            this.pendingCalls.delete(id);
            response.error(new Error("Rosbridge is not connected."));
        }
        return response.asObservable();
    }

    private markUnreachable(): void {
        this.clearLiveValues();
        this.failPendingCalls("Rosbridge is unreachable.");
        this.connectionState$.next("unreachable");
    }

    private clearLiveValues(): void {
        this.audioLevels$.next(undefined);
        this.voiceActivity$.next(undefined);
        this.speechDetected$.next(undefined);
        this.doaAngle$.next(undefined);
    }

    private failPendingCalls(reason: string): void {
        for (const pending of this.pendingCalls.values()) {
            pending.response.error(new Error(reason));
        }
        this.pendingCalls.clear();
    }

    private scheduleReconnect(): void {
        this.clearReconnectTimer();
        const delay = Math.min(1000 * 2 ** this.reconnectAttempt++, 10000);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.shouldReconnect) {
                this.openSocket();
            }
        }, delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private send(socket: WebSocket, message: object): void {
        socket.send(JSON.stringify(message));
    }
}
