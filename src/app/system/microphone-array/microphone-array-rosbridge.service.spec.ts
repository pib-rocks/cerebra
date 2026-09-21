import {TestBed} from "@angular/core/testing";
import {Observable} from "rxjs";
import {MicrophoneArrayRosbridgeService} from "./microphone-array-rosbridge.service";

interface SentMessage {
    op: string;
    id?: string;
    service?: string;
    topic?: string;
    throttle_rate?: number;
    args?: {name: string; value?: string};
}

class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    static instances: FakeWebSocket[] = [];

    readonly sent: SentMessage[] = [];
    readyState = FakeWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onmessage: ((event: {data: string}) => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(readonly url: string) {
        FakeWebSocket.instances.push(this);
    }

    send(data: string): void {
        this.sent.push(JSON.parse(data) as SentMessage);
    }

    open(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }

    receive(message: object): void {
        this.receiveRaw(JSON.stringify(message));
    }

    receiveRaw(data: string): void {
        this.onmessage?.({data});
    }

    fail(): void {
        this.onerror?.();
    }

    close(): void {
        if (this.readyState === FakeWebSocket.CLOSED) {
            return;
        }
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.();
    }
}

interface Recorded<T> {
    values: T[];
    errors: Error[];
    completed: boolean;
}

describe("MicrophoneArrayRosbridgeService", () => {
    let service: MicrophoneArrayRosbridgeService;
    let originalWebSocket: typeof WebSocket;

    beforeEach(() => {
        originalWebSocket = window.WebSocket;
        FakeWebSocket.instances = [];
        window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
        jasmine.clock().install();

        TestBed.configureTestingModule({});
        service = TestBed.inject(MicrophoneArrayRosbridgeService);
    });

    afterEach(() => {
        service.disconnect();
        jasmine.clock().uninstall();
        window.WebSocket = originalWebSocket;
    });

    function record<T>(source: Observable<T>): Recorded<T> {
        const recorded: Recorded<T> = {
            values: [],
            errors: [],
            completed: false,
        };
        source.subscribe({
            next: (value) => recorded.values.push(value),
            error: (error: Error) => recorded.errors.push(error),
            complete: () => {
                recorded.completed = true;
            },
        });
        return recorded;
    }

    function connectAndOpen(): FakeWebSocket {
        service.connect();
        const socket = FakeWebSocket.instances[0];
        socket.open();
        return socket;
    }

    function serviceCalls(
        socket: FakeWebSocket,
        serviceName: string,
    ): SentMessage[] {
        return socket.sent.filter(
            (message) =>
                message.op === "call_service" &&
                message.service === serviceName,
        );
    }

    describe("socket lifecycle", () => {
        it("opens no socket before the first connect", () => {
            expect(FakeWebSocket.instances.length).toBe(0);

            const read = record(service.getParameter("/doa_publisher:preset"));

            expect(FakeWebSocket.instances.length).toBe(0);
            expect(read.values).toEqual([]);
            expect(service.connectionState$.value).toBe("disconnected");
        });

        it("opens the measured rosbridge url on connect", () => {
            service.connect();

            expect(FakeWebSocket.instances.length).toBe(1);
            expect(FakeWebSocket.instances[0].url).toBe(
                `ws://${window.location.hostname}:9090`,
            );
            expect(service.connectionState$.value).toBe("connecting");
        });

        it("opens no second socket while one is connecting or open", () => {
            service.connect();
            service.connect();

            expect(FakeWebSocket.instances.length).toBe(1);

            FakeWebSocket.instances[0].open();
            service.connect();

            expect(FakeWebSocket.instances.length).toBe(1);
            expect(service.connectionState$.value).toBe("live");
        });

        it("subscribes to the four measured topics once open", () => {
            const socket = connectAndOpen();

            expect(socket.sent).toEqual([
                {
                    op: "subscribe",
                    id: "lvl",
                    topic: "/microphone_levels",
                    throttle_rate: 1000,
                },
                {op: "subscribe", id: "vad", topic: "/voice_activity"},
                {op: "subscribe", id: "sp", topic: "/speech_detected"},
                {op: "subscribe", id: "doa", topic: "/doa_angle"},
            ]);
        });

        it("unsubscribes and closes the socket on destroy", () => {
            const socket = connectAndOpen();

            service.disconnect();

            expect(
                socket.sent.filter((message) => message.op === "unsubscribe"),
            ).toEqual([
                {op: "unsubscribe", id: "lvl", topic: "/microphone_levels"},
                {op: "unsubscribe", id: "vad", topic: "/voice_activity"},
                {op: "unsubscribe", id: "sp", topic: "/speech_detected"},
                {op: "unsubscribe", id: "doa", topic: "/doa_angle"},
            ]);
            expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
            expect(service.connectionState$.value).toBe("disconnected");
        });

        it("opens a fresh socket after a destroy", () => {
            connectAndOpen();
            service.disconnect();

            service.connect();

            expect(FakeWebSocket.instances.length).toBe(2);
        });
    });

    describe("service call correlation", () => {
        it("queues a request made before the socket is open and sends it on open", () => {
            service.connect();
            const socket = FakeWebSocket.instances[0];
            record(service.getParameter("/doa_publisher:led_mode"));

            expect(socket.sent).toEqual([]);

            socket.open();
            const requests = serviceCalls(socket, "/rosapi/get_param");

            expect(requests.length).toBe(1);
            expect(requests[0].args).toEqual({
                name: "/doa_publisher:led_mode",
            });
            expect(requests[0].id).toBeTruthy();
        });

        it("answers the request whose id matches the service_response", () => {
            const socket = connectAndOpen();
            const mode = record(
                service.getParameter<string>("/doa_publisher:led_mode"),
            );
            const brightness = record(
                service.getParameter<number>("/doa_publisher:led_brightness"),
            );
            const requests = serviceCalls(socket, "/rosapi/get_param");

            socket.receive({
                op: "service_response",
                id: requests[1].id,
                service: "/rosapi/get_param",
                result: true,
                values: {value: "16", successful: true, reason: ""},
            });

            expect(brightness.values).toEqual([16]);
            expect(brightness.completed).toBeTrue();
            expect(mode.values).toEqual([]);
            expect(mode.completed).toBeFalse();

            socket.receive({
                op: "service_response",
                id: requests[0].id,
                service: "/rosapi/get_param",
                result: true,
                values: {value: '"off"', successful: true, reason: ""},
            });

            expect(mode.values).toEqual(["off"]);
        });

        it("ignores a service_response for an unknown id", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter<string>("/doa_publisher:led_mode"),
            );
            const request = serviceCalls(socket, "/rosapi/get_param")[0];

            socket.receive({
                op: "service_response",
                id: "microphone-does-not-exist",
                service: "/rosapi/get_param",
                result: true,
                values: {value: '"spin"', successful: true, reason: ""},
            });

            expect(read.values).toEqual([]);
            expect(read.errors).toEqual([]);
            expect(read.completed).toBeFalse();

            socket.receive({
                op: "service_response",
                id: request.id,
                service: "/rosapi/get_param",
                result: true,
                values: {value: '"off"', successful: true, reason: ""},
            });

            expect(read.values).toEqual(["off"]);
        });

        it("gives every request its own id", () => {
            const socket = connectAndOpen();
            record(service.getParameter("/doa_publisher:led_mode"));
            record(service.getParameter("/doa_publisher:led_color"));
            record(service.setParameter("/doa_publisher:vad_led", 1));
            const ids = socket.sent
                .filter((message) => message.op === "call_service")
                .map((message) => message.id);

            expect(new Set(ids).size).toBe(3);
        });
    });

    describe("JSON-in-string parameter encoding", () => {
        function respond(
            socket: FakeWebSocket,
            serviceName: string,
            values: object,
        ): void {
            const request = serviceCalls(socket, serviceName).slice(-1)[0];
            socket.receive({
                op: "service_response",
                id: request.id,
                service: serviceName,
                result: true,
                values,
            });
        }

        it("decodes a string parameter answer", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter<string>("/doa_publisher:led_mode"),
            );

            respond(socket, "/rosapi/get_param", {
                value: '"off"',
                successful: true,
                reason: "",
            });

            expect(read.values).toEqual(["off"]);
        });

        it("decodes a double parameter answer as a number", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter<number>("/doa_publisher:AGCMAXGAIN"),
            );

            respond(socket, "/rosapi/get_param", {
                value: "31.6",
                successful: true,
                reason: "",
            });

            expect(read.values).toEqual([31.6]);
            expect(typeof read.values[0]).toBe("number");
        });

        it("sends an integer write JSON-encoded", () => {
            const socket = connectAndOpen();
            record(service.setParameter("/doa_publisher:led_brightness", 16));

            expect(serviceCalls(socket, "/rosapi/set_param")[0].args).toEqual({
                name: "/doa_publisher:led_brightness",
                value: "16",
            });
        });

        it("sends a string write JSON-encoded with its quotes", () => {
            const socket = connectAndOpen();
            record(service.setParameter("/doa_publisher:led_mode", "off"));

            expect(serviceCalls(socket, "/rosapi/set_param")[0].args).toEqual({
                name: "/doa_publisher:led_mode",
                value: '"off"',
            });
        });

        it("completes a successful write without a value", () => {
            const socket = connectAndOpen();
            const write = record(
                service.setParameter("/doa_publisher:led_brightness", 16),
            );

            respond(socket, "/rosapi/set_param", {
                successful: true,
                reason: "",
            });

            expect(write.errors).toEqual([]);
            expect(write.completed).toBeTrue();
        });

        it("surfaces the node's reason verbatim and does not report a rejected write as applied", () => {
            const socket = connectAndOpen();
            const write = record(
                service.setParameter("/doa_publisher:led_brightness", 32),
            );

            respond(socket, "/rosapi/set_param", {
                successful: false,
                reason: "led_brightness must be in range [0, 31]",
            });

            expect(write.values).toEqual([]);
            expect(write.completed).toBeFalse();
            expect(write.errors.length).toBe(1);
            expect(write.errors[0].message).toBe(
                "led_brightness must be in range [0, 31]",
            );
        });

        it("surfaces a rejected read's reason verbatim", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter("/doa_publisher:not_a_parameter"),
            );

            respond(socket, "/rosapi/get_param", {
                value: "",
                successful: false,
                reason: "Parameter not set",
            });

            expect(read.values).toEqual([]);
            expect(read.errors[0].message).toBe("Parameter not set");
        });
    });

    describe("requests without an answer", () => {
        // The client has no request timeout: a pending call is only released
        // when the socket drops. Waiting alone never fails it.
        it("keeps an unanswered request pending while the socket stays up", () => {
            connectAndOpen();
            const read = record(
                service.getParameter("/doa_publisher:led_mode"),
            );

            jasmine.clock().tick(60000);

            expect(read.values).toEqual([]);
            expect(read.errors).toEqual([]);
            expect(read.completed).toBeFalse();
        });

        it("fails a pending request when the socket errors", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter("/doa_publisher:led_mode"),
            );

            socket.fail();

            expect(read.errors.length).toBe(1);
            expect(read.errors[0].message).toBe("Rosbridge is unreachable.");
        });

        it("fails a pending request on destroy", () => {
            connectAndOpen();
            const read = record(
                service.getParameter("/doa_publisher:led_mode"),
            );

            service.disconnect();

            expect(read.errors.length).toBe(1);
            expect(read.errors[0].message).toBe("Rosbridge disconnected.");
        });

        it("fails a pending request on close instead of replaying it on the next socket", () => {
            const socket = connectAndOpen();
            const read = record(
                service.getParameter("/doa_publisher:led_mode"),
            );

            socket.close();
            jasmine.clock().tick(1000);
            const reconnected = FakeWebSocket.instances[1];
            reconnected.open();

            expect(read.errors.length).toBe(1);
            expect(serviceCalls(reconnected, "/rosapi/get_param").length).toBe(
                0,
            );
        });
    });

    describe("a socket that goes away", () => {
        function publishEverything(socket: FakeWebSocket): void {
            socket.receive({
                op: "publish",
                topic: "/microphone_levels",
                msg: {
                    layout: {dim: [], data_offset: 0},
                    data: [0.0016977920895442367, 0.0059814453125],
                },
            });
            socket.receive({
                op: "publish",
                topic: "/voice_activity",
                msg: {data: true},
            });
            socket.receive({
                op: "publish",
                topic: "/speech_detected",
                msg: {data: true},
            });
            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 123},
            });
        }

        it("reports unreachable and clears the live values when the socket closes", () => {
            const socket = connectAndOpen();
            publishEverything(socket);

            socket.close();

            expect(service.connectionState$.value).toBe("unreachable");
            expect(service.audioLevels$.value).toBeUndefined();
            expect(service.voiceActivity$.value).toBeUndefined();
            expect(service.speechDetected$.value).toBeUndefined();
            expect(service.doaAngle$.value).toBeUndefined();
        });

        it("reports disconnected and clears the live values on destroy", () => {
            const socket = connectAndOpen();
            publishEverything(socket);

            service.disconnect();

            expect(service.connectionState$.value).toBe("disconnected");
            expect(service.audioLevels$.value).toBeUndefined();
            expect(service.doaAngle$.value).toBeUndefined();
        });

        it("fabricates no reading from a closed socket", () => {
            const socket = connectAndOpen();
            publishEverything(socket);
            socket.close();

            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 200},
            });

            expect(service.doaAngle$.value).toBeUndefined();
        });

        it("reconnects with a growing, capped delay", () => {
            connectAndOpen();
            const expectedDelays = [1000, 2000, 4000, 8000, 10000, 10000];

            expectedDelays.forEach((delay, index) => {
                FakeWebSocket.instances[index].close();

                jasmine.clock().tick(delay - 1);
                expect(FakeWebSocket.instances.length).toBe(index + 1);

                jasmine.clock().tick(1);
                expect(FakeWebSocket.instances.length).toBe(index + 2);
            });
        });

        it("restarts the backoff after a successful reconnect", () => {
            connectAndOpen();
            FakeWebSocket.instances[0].close();
            jasmine.clock().tick(1000);
            FakeWebSocket.instances[1].open();

            FakeWebSocket.instances[1].close();
            jasmine.clock().tick(1000);

            expect(FakeWebSocket.instances.length).toBe(3);
        });

        it("does not reconnect after a destroy", () => {
            connectAndOpen();

            service.disconnect();
            jasmine.clock().tick(60000);

            expect(FakeWebSocket.instances.length).toBe(1);
        });
    });

    describe("incoming publish messages", () => {
        let socket: FakeWebSocket;

        beforeEach(() => {
            socket = connectAndOpen();
        });

        it("routes each measured topic to its own consumer", () => {
            socket.receive({
                op: "publish",
                topic: "/microphone_levels",
                msg: {
                    layout: {dim: [], data_offset: 0},
                    data: [0.0016977920895442367, 0.0059814453125],
                },
            });
            socket.receive({
                op: "publish",
                topic: "/voice_activity",
                msg: {data: true},
            });
            socket.receive({
                op: "publish",
                topic: "/speech_detected",
                msg: {data: false},
            });
            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 359},
            });

            expect(service.audioLevels$.value).toEqual([
                0.0016977920895442367, 0.0059814453125,
            ]);
            expect(service.voiceActivity$.value).toBeTrue();
            expect(service.speechDetected$.value).toBeFalse();
            expect(service.doaAngle$.value).toBe(359);
        });

        it("ignores messages that are not valid JSON", () => {
            expect(() => socket.receiveRaw("<html>400</html>")).not.toThrow();
            expect(service.doaAngle$.value).toBeUndefined();
        });

        it("ignores messages outside the measured contract", () => {
            const outOfContract = [
                {
                    op: "publish",
                    topic: "/microphone_levels",
                    msg: {data: [0.1]},
                },
                {
                    op: "publish",
                    topic: "/microphone_levels",
                    msg: {data: [0.1, 0.2, 0.3]},
                },
                {
                    op: "publish",
                    topic: "/microphone_levels",
                    msg: {data: [0.1, 1.5]},
                },
                {
                    op: "publish",
                    topic: "/microphone_levels",
                    msg: {data: ["0.1", "0.2"]},
                },
                {op: "publish", topic: "/microphone_levels", msg: {}},
                {op: "publish", topic: "/microphone_levels"},
                {op: "publish", topic: "/voice_activity", msg: {data: "true"}},
                {op: "publish", topic: "/speech_detected", msg: {data: 1}},
                {op: "publish", topic: "/doa_angle", msg: {data: 360}},
                {op: "publish", topic: "/doa_angle", msg: {data: -1}},
                {op: "publish", topic: "/doa_angle", msg: {data: 12.5}},
                {op: "publish", topic: "/doa_angle", msg: {data: "123"}},
                {op: "publish", topic: "/rosout", msg: {data: 42}},
                {op: "status", level: "error", msg: "no such topic"},
                {op: "service_response", result: true},
                {topic: "/doa_angle", msg: {data: 42}},
                {},
            ];

            for (const message of outOfContract) {
                expect(() => socket.receive(message)).not.toThrow();
            }

            expect(service.audioLevels$.value).toBeUndefined();
            expect(service.voiceActivity$.value).toBeUndefined();
            expect(service.speechDetected$.value).toBeUndefined();
            expect(service.doaAngle$.value).toBeUndefined();
            expect(service.connectionState$.value).toBe("live");
        });

        it("keeps the last reported value when a later message is malformed", () => {
            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 42},
            });
            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 999},
            });

            expect(service.doaAngle$.value).toBe(42);
        });

        it("ignores messages from a socket the service already replaced", () => {
            socket.close();
            jasmine.clock().tick(1000);
            const reconnected = FakeWebSocket.instances[1];
            reconnected.open();

            socket.receive({
                op: "publish",
                topic: "/doa_angle",
                msg: {data: 42},
            });

            expect(service.doaAngle$.value).toBeUndefined();
        });
    });
});
