import * as ROSLIB from "roslib";
import {
    callRosServiceBooleanFallback$,
    callRosServiceReplay$,
    callRosServiceVoidWhenSuccessful$,
    emitReplayOnce$,
    serviceErrorText,
} from "./ros-service-call.helper";

describe("ros-service-call.helper", () => {
    it("formats service errors", () => {
        expect(serviceErrorText("boom")).toBe("boom");
        expect(serviceErrorText(new Error("bad"))).toBe("bad");
        expect(serviceErrorText(null)).toBe("Token service error");
    });

    it("completes emitReplayOnce$ after emitting", () => {
        let completed = false;
        emitReplayOnce$("ok").subscribe({
            next: (value) => expect(value).toBe("ok"),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes boolean fallback observables after success and error", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {successful: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {successful: boolean}) => void) =>
                success({successful: true}),
        );
        let completed = false;
        callRosServiceBooleanFallback$(
            service,
            {},
            (r) => r.successful,
        ).subscribe({complete: () => (completed = true)});
        expect(completed).toBeTrue();

        service.callService.and.callFake((_req, _s, error: () => void) =>
            error(),
        );
        completed = false;
        callRosServiceBooleanFallback$(
            service,
            {},
            (r) => r.successful,
        ).subscribe({
            next: (value) => expect(value).toBeFalse(),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes void service calls after a successful response", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {successful: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {successful: boolean}) => void) =>
                success({successful: true}),
        );
        let completed = false;
        callRosServiceVoidWhenSuccessful$(service, {}, "failed").subscribe({
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes replay service calls after mapping success", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {listening: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {listening: boolean}) => void) =>
                success({listening: true}),
        );
        let completed = false;
        callRosServiceReplay$(
            service,
            {},
            {
                mapSuccess: (response) => response.listening,
            },
        ).subscribe({
            next: (value) => expect(value).toBeTrue(),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });
});

import {BehaviorSubject, Subject} from "rxjs";
import {
    publishDisplayTextOnHost,
    publishExpressionOnHost,
    publishProgramInputOnHost,
    setPreviewSizeOnHost,
    setQualityFactorOnHost,
    setTimerPeriodOnHost,
} from "./ros-publish.helper";
import {
    clearDetectionTopics,
    refreshDetectionTopics,
    startDetectionTopicDiscovery,
    stopDetectionTopicDiscovery,
    subscribeModelStatusTopic,
    syncDetectionTopics,
} from "./ros-detection-topology.helper";
import {callApplyMotorSettings$} from "./ros-service-call.helper";

describe("ros-publish and detection topology helpers", () => {
    it("publishes camera, program input, expression, and display text only when topics exist", () => {
        const published: Array<[string, unknown]> = [];
        const emptyHost = {
            programInputTopic: {
                publish: (m: unknown) => published.push(["input", m]),
            },
        };
        setTimerPeriodOnHost(emptyHost, 0.2);
        setPreviewSizeOnHost(emptyHost, 640, 480);
        setQualityFactorOnHost(emptyHost, 75);
        publishExpressionOnHost(emptyHost, "happy");
        publishDisplayTextOnHost(emptyHost, "hello");
        publishProgramInputOnHost(emptyHost, "abc", 42);
        expect(published).toEqual([["input", {input: "abc", mpid: 42}]]);

        const fullHost = {
            cameraTimerPeriodTopic: {
                publish: (m: unknown) => published.push(["period", m]),
            },
            cameraPreviewSizeTopic: {
                publish: (m: unknown) => published.push(["size", m]),
            },
            cameraQualityFactorTopic: {
                publish: (m: unknown) => published.push(["quality", m]),
            },
            programInputTopic: {
                publish: (m: unknown) => published.push(["input", m]),
            },
            expressionTopic: {
                publish: (m: unknown) => published.push(["expr", m]),
            },
            displayTextTopic: {
                publish: (m: unknown) => published.push(["text", m]),
            },
        };
        setTimerPeriodOnHost(fullHost, 0.5);
        setPreviewSizeOnHost(fullHost, 320, 240);
        setQualityFactorOnHost(fullHost, 80);
        publishExpressionOnHost(fullHost, "blink");
        publishDisplayTextOnHost(fullHost, "hi");
        expect(published.length).toBe(6);
    });

    it("manages detection topics, discovery errors, and model status changes", () => {
        const unsubscribed: string[] = [];
        const created = new Map<string, (msg: any) => void>();
        let getTopicsMode: "ok" | "error" = "ok";
        const host: any = {
            ros: {
                getTopics: (
                    onOk: (r: {topics: string[]}) => void,
                    onErr: (e: unknown) => void,
                ) => {
                    if (getTopicsMode === "ok") {
                        onOk({
                            topics: [
                                "/detections/b_model",
                                "/detections/a_model",
                            ],
                        });
                    } else {
                        onErr(new Error("rosbridge down"));
                    }
                },
            },
            detectionTopics: new Map(),
            detectionReceiver$: new Subject(),
            detectionModelsReceiver$: new BehaviorSubject<string[]>([]),
            detectionClearReceiver$: new Subject<string | undefined>(),
            detectionDiscoveryGeneration: 0,
            detectionDiscoveryInFlight: false,
            modelStatusTopic: {
                subscribe: (cb: (msg: any) => void) => {
                    created.set("status", cb);
                },
            },
            modelStatusReceiver$: new BehaviorSubject({models: []}),
            createRosTopic: (name: string) => ({
                subscribe: (cb: (msg: any) => void) => created.set(name, cb),
                unsubscribe: () => unsubscribed.push(name),
            }),
        };

        startDetectionTopicDiscovery(host);
        expect(host.detectionModelsReceiver$.value).toEqual([
            "a_model",
            "b_model",
        ]);
        stopDetectionTopicDiscovery(host);

        const cbA = created.get("/detections/a_model")!;
        const received: any[] = [];
        host.detectionReceiver$.subscribe((d: any) => received.push(d));
        cbA({detections: []});
        expect(received[0].model_id).toBe("a_model");

        syncDetectionTopics(host, ["/detections/b_model"]);
        expect(unsubscribed).toContain("/detections/a_model");

        getTopicsMode = "error";
        refreshDetectionTopics(host);
        expect(host.detectionDiscoveryInFlight).toBeFalse();

        subscribeModelStatusTopic(host);
        const statusCb = created.get("status")!;
        statusCb({
            models: [
                {model_id: "z", state: "running", active: true},
                {model_id: "a", state: "idle", active: false},
            ],
        });
        statusCb({
            models: [
                {model_id: "z", state: "stopped", active: false},
                {model_id: "a", state: "idle", active: false},
            ],
        });

        clearDetectionTopics(host);
        expect(host.detectionTopics.size).toBe(0);
    });

    it("covers callApplyMotorSettings$ error and unpersisted branches", () => {
        const msg: any = {motor_name: "head_pan"};
        let err1: unknown;
        callApplyMotorSettings$(
            {
                callService: (_req: any, ok: any) =>
                    ok({settings_applied: true, settings_persisted: false}),
            } as any,
            msg,
        ).subscribe({error: (e) => (err1 = e)});
        expect(err1).toBeTruthy();

        let err2: unknown;
        callApplyMotorSettings$(
            {
                callService: (_req: any, ok: any) =>
                    ok({settings_applied: false, settings_persisted: false}),
            } as any,
            msg,
        ).subscribe({error: (e) => (err2 = e)});
        expect(err2).toBeTruthy();

        let err3: unknown;
        callApplyMotorSettings$(
            {
                callService: (_req: any, _ok: any, fail: any) =>
                    fail("rpc err"),
            } as any,
            msg,
        ).subscribe({error: (e) => (err3 = e)});
        expect((err3 as Error).message).toBe("rpc err");
    });
});
