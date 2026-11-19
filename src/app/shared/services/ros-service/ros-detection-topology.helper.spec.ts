import * as ROSLIB from "roslib";
import {BehaviorSubject, Subject} from "rxjs";
import {DetectionArray} from "../../ros-types/msg/detection-array";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {
    DETECTION_DISCOVERY_INITIAL_BACKOFF_MS,
    DETECTION_DISCOVERY_POLL_MS,
    DETECTION_DISCOVERY_TIMEOUT_MS,
    RosDetectionTopologyHost,
    refreshDetectionTopics,
    startDetectionTopicDiscovery,
    stopDetectionTopicDiscovery,
    subscribeModelStatusTopic,
} from "./ros-detection-topology.helper";

describe("ros-detection-topology.helper (PR-1830)", () => {
    let getTopicsSpy: jasmine.Spy;
    let host: RosDetectionTopologyHost & {
        modelStatusTopic: ROSLIB.Topic<ModelStatusArray>;
        modelStatusReceiver$: BehaviorSubject<ModelStatusArray>;
        lastModelStatus?: string;
    };
    let modelStatusCallback: ((msg: ModelStatusArray) => void) | undefined;

    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(2026, 10, 19, 12, 0, 0));

        getTopicsSpy = jasmine.createSpy("getTopics");
        modelStatusCallback = undefined;

        const modelStatusTopic = {
            subscribe: (cb: (msg: ModelStatusArray) => void) => {
                modelStatusCallback = cb;
            },
        } as unknown as ROSLIB.Topic<ModelStatusArray>;

        host = {
            ros: {getTopics: getTopicsSpy} as unknown as ROSLIB.Ros,
            detectionTopics: new Map(),
            detectionReceiver$: new Subject<DetectionArray>(),
            detectionModelsReceiver$: new BehaviorSubject<string[]>([]),
            detectionClearReceiver$: new Subject<string | undefined>(),
            detectionDiscoveryGeneration: 0,
            detectionDiscoveryInFlight: false,
            modelStatusTopic,
            modelStatusReceiver$: new BehaviorSubject<ModelStatusArray>({
                models: [],
            }),
            createRosTopic: <T>() =>
                ({
                    subscribe: jasmine.createSpy("subscribe"),
                    unsubscribe: jasmine.createSpy("unsubscribe"),
                }) as unknown as ROSLIB.Topic<T>,
        };
    });

    afterEach(() => {
        stopDetectionTopicDiscovery(host);
        jasmine.clock().uninstall();
    });

    it("does not re-query rosapi/topics on unchanged model_status heartbeats", () => {
        getTopicsSpy.and.callFake(
            (onSuccess: (res: {topics: string[]}) => void) =>
                onSuccess({topics: ["/detections/hand"]}),
        );
        subscribeModelStatusTopic(host);
        expect(modelStatusCallback).toBeDefined();

        const heartbeat: ModelStatusArray = {
            models: [{model_id: "hand", state: "running", active: true} as any],
        };
        modelStatusCallback!(heartbeat);
        expect(getTopicsSpy.calls.count()).toBe(1);

        // Ten identical heartbeats must not trigger additional rosapi/topics calls.
        for (let i = 0; i < 10; i++) {
            modelStatusCallback!(heartbeat);
        }
        expect(getTopicsSpy.calls.count()).toBe(1);

        // An actual state change triggers discovery immediately.
        modelStatusCallback!({
            models: [
                {model_id: "hand", state: "stopped", active: false} as any,
            ],
        });
        expect(getTopicsSpy.calls.count()).toBe(2);
    });

    it("polls on the bounded reconciliation interval instead of every second", () => {
        getTopicsSpy.and.callFake(
            (onSuccess: (res: {topics: string[]}) => void) =>
                onSuccess({topics: []}),
        );
        startDetectionTopicDiscovery(host);
        expect(getTopicsSpy.calls.count()).toBe(1);

        jasmine.clock().tick(10_000);
        expect(getTopicsSpy.calls.count()).toBe(1);

        jasmine.clock().tick(DETECTION_DISCOVERY_POLL_MS - 10_000);
        expect(getTopicsSpy.calls.count()).toBe(2);
    });

    it("backs off exponentially on failure and logs once per failure streak", () => {
        const errorSpy = spyOn(console, "error");
        getTopicsSpy.and.callFake(
            (_onSuccess: unknown, onError: (err: unknown) => void) =>
                onError("Timeout exceeded while waiting for service response"),
        );

        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(1);
        expect(errorSpy.calls.count()).toBe(1);

        // Inside the initial 5 s backoff window, repeated triggers are suppressed.
        jasmine.clock().tick(DETECTION_DISCOVERY_INITIAL_BACKOFF_MS - 1);
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(1);

        // After 5 s backoff expires, second attempt fires and backs off for 10 s without spamming console.error.
        jasmine.clock().tick(1);
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(2);
        expect(errorSpy.calls.count()).toBe(1);

        jasmine.clock().tick(DETECTION_DISCOVERY_INITIAL_BACKOFF_MS * 2 - 1);
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(2);

        // Once rosapi recovers, backoff and error logging reset.
        getTopicsSpy.and.callFake(
            (onSuccess: (res: {topics: string[]}) => void) =>
                onSuccess({topics: ["/detections/face"]}),
        );
        jasmine.clock().tick(1);
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(3);
        expect(host.detectionDiscoveryFailureCount).toBe(0);
        expect(host.detectionDiscoveryErrorLogged).toBeFalse();
    });

    it("times out a hung rosapi/topics call, backs off, and recovers later", () => {
        const errorSpy = spyOn(console, "error");
        // Never invokes either callback (simulates hung rosapi).
        getTopicsSpy.and.callFake(() => {});

        refreshDetectionTopics(host);
        expect(host.detectionDiscoveryInFlight).toBeTrue();

        jasmine.clock().tick(DETECTION_DISCOVERY_TIMEOUT_MS);
        expect(host.detectionDiscoveryInFlight).toBeFalse();
        expect(errorSpy.calls.count()).toBe(1);

        // Still backed off right after timeout.
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(1);

        // After backoff expires, a healthy reply succeeds cleanly.
        getTopicsSpy.and.callFake(
            (onSuccess: (res: {topics: string[]}) => void) =>
                onSuccess({topics: ["/detections/yolo"]}),
        );
        jasmine.clock().tick(DETECTION_DISCOVERY_INITIAL_BACKOFF_MS);
        refreshDetectionTopics(host);
        expect(getTopicsSpy.calls.count()).toBe(2);
        expect(host.detectionModelsReceiver$.value).toEqual(["yolo"]);
    });
});
