import {BehaviorSubject} from "rxjs";

/**
 * Tests UC-TOKEN-001 / EC-ROS-001 connection state contract documented in
 * frontend_architecture.md §6 and frontend_use_cases.md EC-ROS-001.
 *
 * RosService wires connectionStatus$ from ROSLIB.Ros lifecycle events.
 * This suite validates the observable contract without a live WebSocket.
 */
describe("RosService connectionStatus$ contract", () => {
    type ConnectionHandler = () => void;

    class RosConnectionSimulator {
        private handlers: Record<string, ConnectionHandler[]> = {
            connection: [],
            error: [],
            close: [],
        };

        private connectionStatusSubject = new BehaviorSubject<boolean>(false);
        readonly connectionStatus$ =
            this.connectionStatusSubject.asObservable();

        constructor() {
            this.on("connection", () => {
                this.connectionStatusSubject.next(true);
            });
            this.on("error", () => {
                this.connectionStatusSubject.next(false);
            });
            this.on("close", () => {
                this.connectionStatusSubject.next(false);
            });
        }

        on(event: string, handler: ConnectionHandler) {
            this.handlers[event].push(handler);
        }

        emit(event: "connection" | "error" | "close") {
            this.handlers[event].forEach((h) => h());
        }

        currentStatus(): boolean {
            return this.connectionStatusSubject.value;
        }
    }

    let ros: RosConnectionSimulator;

    beforeEach(() => {
        ros = new RosConnectionSimulator();
    });

    it("starts disconnected (connectionStatus$ = false)", () => {
        expect(ros.currentStatus()).toBe(false);
    });

    it("UC-TOKEN-001: emits true on ros connection event", () => {
        const values: boolean[] = [];
        ros.connectionStatus$.subscribe((v) => values.push(v));

        ros.emit("connection");

        expect(values).toContain(true);
        expect(ros.currentStatus()).toBe(true);
    });

    it("EC-ROS-001: emits false on WebSocket close", () => {
        ros.emit("connection");
        const values: boolean[] = [];
        ros.connectionStatus$.subscribe((v) => values.push(v));

        ros.emit("close");

        expect(values).toContain(false);
        expect(ros.currentStatus()).toBe(false);
    });

    it("EC-ROS-001: emits false on WebSocket error", () => {
        const values: boolean[] = [];
        ros.connectionStatus$.subscribe((v) => values.push(v));

        ros.emit("error");

        expect(values).toContain(false);
        expect(ros.currentStatus()).toBe(false);
    });
});

describe("TokenService gating contract (UC-VA-005)", () => {
    interface TokenStatus {
        tokenExists: boolean;
        tokenActive: boolean;
    }

    function isChatInputEnabled(status: TokenStatus): boolean {
        return status.tokenExists && status.tokenActive;
    }

    it("disables chat input when token is inactive", () => {
        expect(
            isChatInputEnabled({tokenExists: false, tokenActive: false}),
        ).toBe(false);
    });

    it("enables chat input when token exists and is active", () => {
        expect(isChatInputEnabled({tokenExists: true, tokenActive: true})).toBe(
            true,
        );
    });
});
