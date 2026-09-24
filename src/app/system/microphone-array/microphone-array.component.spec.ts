import {ComponentFixture, TestBed} from "@angular/core/testing";
import {of} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {MicrophoneArrayComponent} from "./microphone-array.component";

interface SentMessage {
    op: string;
    id: string;
    service?: string;
    topic?: string;
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
        this.onmessage?.({data: JSON.stringify(message)});
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

describe("MicrophoneArrayComponent live cockpit", () => {
    let fixture: ComponentFixture<MicrophoneArrayComponent>;
    let component: MicrophoneArrayComponent;
    let socket: FakeWebSocket;
    let originalWebSocket: typeof WebSocket;
    let respondedIds: Set<string>;

    let parameterValues: Record<string, unknown>;

    beforeEach(async () => {
        parameterValues = {
            preset: "Standard",
            led_mode: "off",
            led_brightness: 16,
            led_color: "#000000",
            vad_led: 0,
            AGCONOFF: 1,
            AGCMAXGAIN: 31.6,
            AGCDESIREDLEVEL: 0.005,
            AGCTIME: 1,
            HPFONOFF: 1,
            ECHOONOFF: 1,
            STATNOISEONOFF: 1,
            STATNOISEONOFF_SR: 1,
            NONSTATNOISEONOFF: 1,
            NONSTATNOISEONOFF_SR: 1,
        };
        originalWebSocket = window.WebSocket;
        FakeWebSocket.instances = [];
        respondedIds = new Set<string>();
        window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

        const apiService = jasmine.createSpyObj<ApiService>("ApiService", [
            "get",
        ]);
        apiService.get.and.returnValue(
            of({
                simulation: true,
                simulation_reason: "backend has no device access",
                device_access: false,
                owner: "ros-audio-io",
                vendor_id: "0x2886",
                product_id: "0x0018",
                note: "Live values come from the ros-audio-io owner.",
            }),
        );

        await TestBed.configureTestingModule({
            imports: [MicrophoneArrayComponent],
            providers: [{provide: ApiService, useValue: apiService}],
        }).compileComponents();

        fixture = TestBed.createComponent(MicrophoneArrayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        socket = FakeWebSocket.instances[0];
    });

    afterEach(() => {
        fixture.destroy();
        window.WebSocket = originalWebSocket;
    });

    function serviceCalls(service: string): SentMessage[] {
        return socket.sent.filter(
            (message) =>
                message.op === "call_service" &&
                message.service === service &&
                !respondedIds.has(message.id),
        );
    }

    function respondToParameterReads(): void {
        for (const request of [...serviceCalls("/rosapi/get_param")]) {
            const name = request.args?.name ?? "";
            const parameterName = name.split(":")[1];
            expect(name.startsWith("/doa_publisher:")).toBeTrue();
            respondedIds.add(request.id);
            socket.receive({
                op: "service_response",
                id: request.id,
                service: "/rosapi/get_param",
                result: true,
                values: {
                    value: JSON.stringify(parameterValues[parameterName]),
                    successful: true,
                    reason: "",
                },
            });
        }
        fixture.detectChanges();
    }

    function openAndLoadParameters(): void {
        socket.open();
        expect(socket.url).toBe(`ws://${window.location.hostname}:9090`);
        respondToParameterReads();
    }

    it("renders measured live topics and identifies rosbridge as the source", () => {
        openAndLoadParameters();

        socket.receive({
            op: "publish",
            topic: "/microphone_levels",
            msg: {
                layout: {dim: [], data_offset: 0},
                data: [0.25, 0.75],
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
            msg: {data: 123},
        });
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(
            element.querySelector("[data-test='TXT_Telemetry_Source']")
                ?.textContent,
        ).toContain("Live via rosbridge");
        expect(
            element.querySelector("[data-test='TXT_DOA_Angle']")?.textContent,
        ).toContain("123°");
        expect(
            element.querySelector("[data-test='BADGE_VAD']")?.textContent,
        ).toContain("Active");
        expect(
            element.querySelector("[data-test='BADGE_Speech']")?.textContent,
        ).toContain("None");
        expect(
            element.querySelector("[data-test='TXT_Audio_Level_0']")
                ?.textContent,
        ).toContain("25%");
        expect(
            element.querySelector("[data-test='TXT_Audio_Level_1']")
                ?.textContent,
        ).toContain("75%");

        const levelSubscription = socket.sent.find(
            (message) =>
                message.op === "subscribe" &&
                message.topic === "/microphone_levels",
        ) as SentMessage & {throttle_rate?: number};
        expect(levelSubscription.throttle_rate).toBe(1000);
    });

    it("reads parameters with the measured node:param names and JSON strings", () => {
        openAndLoadParameters();

        expect(component.tuning?.preset).toBe("Standard");
        expect(component.tuning?.ledMode).toBe("off");
        expect(component.tuning?.ledBrightness).toBe(16);
        expect(component.tuning?.agcMaxGain).toBe(31.6);
        expect(component.tuning?.agcEnabled).toBeTrue();
        expect(serviceCalls("/rosapi/get_param").length).toBe(0);
    });

    it("writes one JSON-in-string parameter and re-reads device values", () => {
        openAndLoadParameters();
        component.tuning!.ledBrightness = 20;
        component.onLedChange("brightness");

        const request = serviceCalls("/rosapi/set_param")[0];
        expect(request.args).toEqual({
            name: "/doa_publisher:led_brightness",
            value: "20",
        });
        respondedIds.add(request.id);
        parameterValues["led_brightness"] = 19;
        socket.receive({
            op: "service_response",
            id: request.id,
            service: "/rosapi/set_param",
            result: true,
            values: {successful: true, reason: ""},
        });
        respondToParameterReads();

        expect(component.tuning?.ledBrightness).toBe(19);
        expect(component.successMessage).toBe("Tuning updated.");
    });

    it("shows a rejected write's node reason verbatim", () => {
        openAndLoadParameters();
        component.tuning!.ledBrightness = 32;
        component.onLedChange("brightness");
        const request = serviceCalls("/rosapi/set_param")[0];

        socket.receive({
            op: "service_response",
            id: request.id,
            service: "/rosapi/set_param",
            result: true,
            values: {
                successful: false,
                reason: "led_brightness must be in range [0, 31]",
            },
        });
        fixture.detectChanges();

        expect(component.error).toBe("led_brightness must be in range [0, 31]");
        expect(
            (fixture.nativeElement as HTMLElement).querySelector(
                "[data-test='MSG_Microphone_Array_Error']",
            )?.textContent,
        ).toContain("led_brightness must be in range [0, 31]");
    });

    it("shows unreachable and fabricates no values while disconnected", () => {
        let element = fixture.nativeElement as HTMLElement;
        expect(
            element.querySelector("[data-test='TXT_DOA_Angle']")?.textContent,
        ).toContain("not reported");
        expect(
            element.querySelector("[data-test='BADGE_VAD']")?.textContent,
        ).toContain("not reported");
        expect(
            element.querySelector(
                "[data-test='TXT_Audio_Levels_Not_Reported']",
            ),
        ).toBeTruthy();

        socket.open();
        socket.receive({
            op: "publish",
            topic: "/doa_angle",
            msg: {data: 270},
        });
        fixture.detectChanges();
        expect(component.doaAngle).toBe(270);

        socket.fail();
        fixture.detectChanges();
        element = fixture.nativeElement as HTMLElement;
        expect(component.doaAngle).toBeNull();
        expect(
            element.querySelector("[data-test='TXT_Telemetry_Source']")
                ?.textContent,
        ).toContain("Rosbridge not reachable");
        expect(
            element.querySelector("[data-test='TXT_DOA_Angle']")?.textContent,
        ).toContain("not reported");
    });

    it("labels backend simulation facts separately from live values", () => {
        const banner = (fixture.nativeElement as HTMLElement).querySelector(
            "[data-test='MSG_Microphone_Array_Simulation']",
        );
        expect(banner?.textContent).toContain(
            "Backend legacy/simulation answer",
        );
        expect(banner?.textContent).toContain("backend has no device access");
        expect(banner?.textContent).toContain("ros-audio-io");
    });

    it("subscribes to exactly the four measured topics", () => {
        socket.open();
        const subscriptions = socket.sent.filter(
            (message) => message.op === "subscribe",
        );

        expect(subscriptions.map((message) => message.topic)).toEqual([
            "/microphone_levels",
            "/voice_activity",
            "/speech_detected",
            "/doa_angle",
        ]);
    });

    it("renders the backend owner and legacy health facts", () => {
        const element = fixture.nativeElement as HTMLElement;

        expect(
            element.querySelector("[data-test='TXT_Health_Source']")
                ?.textContent,
        ).toContain("Backend legacy/simulation answer");
        expect(
            element.querySelector("[data-test='TXT_Microphone_Array_Owner']")
                ?.textContent,
        ).toContain("ros-audio-io");
        expect(
            element.querySelector(
                "[data-test='TXT_Microphone_Array_Device_Access']",
            )?.textContent,
        ).toContain("No");
    });

    it("maps the reported parameters to their controls", () => {
        openAndLoadParameters();
        const element = fixture.nativeElement as HTMLElement;

        expect(component.tuning?.agcEnabled).toBeTrue();
        expect(component.tuning?.agcMaxGain).toBe(31.6);
        expect(component.tuning?.highPassFilter).toBe(1);
        expect(
            (
                element.querySelector(
                    "[data-test='SEL_High_Pass_Filter']",
                ) as HTMLSelectElement
            ).textContent,
        ).toContain("70Hz");
    });

    it("converts the reported target level between linear and dBov", () => {
        openAndLoadParameters();

        expect(component.getTargetLevelDbov()).toBeCloseTo(-23, 0);
        component.setTargetLevelDbov(-20);
        expect(component.tuning?.agcDesiredLevel).toBeCloseTo(0.01, 5);
    });

    it("writes only the DSP parameter changed by one action", () => {
        openAndLoadParameters();
        component.tuning!.agcMaxGain = 45;
        component.onDspChange("AGCMAXGAIN");

        const request = serviceCalls("/rosapi/set_param")[0];
        expect(request.args).toEqual({
            name: "/doa_publisher:AGCMAXGAIN",
            value: "45",
        });
        socket.receive({
            op: "service_response",
            id: request.id,
            service: "/rosapi/set_param",
            result: true,
            values: {successful: false, reason: "test cleanup"},
        });
    });

    it("JSON-encodes a string parameter inside the service argument", () => {
        openAndLoadParameters();
        component.onPresetChange("Raw");

        const request = serviceCalls("/rosapi/set_param")[0];
        expect(request.args).toEqual({
            name: "/doa_publisher:preset",
            value: '"Raw"',
        });
        socket.receive({
            op: "service_response",
            id: request.id,
            service: "/rosapi/set_param",
            result: true,
            values: {successful: false, reason: "test cleanup"},
        });
    });

    it("ignores topic values outside the measured contract", () => {
        socket.open();
        socket.receive({
            op: "publish",
            topic: "/microphone_levels",
            msg: {data: [0.1, 0.2, 0.3]},
        });
        socket.receive({
            op: "publish",
            topic: "/doa_angle",
            msg: {data: 360},
        });
        fixture.detectChanges();

        expect(component.audioLevels).toEqual([]);
        expect(component.doaAngle).toBeNull();
    });

    it("unsubscribes and closes rosbridge when the cockpit is destroyed", () => {
        socket.open();
        fixture.destroy();

        expect(
            socket.sent.filter((message) => message.op === "unsubscribe")
                .length,
        ).toBe(4);
        expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
    });
});
