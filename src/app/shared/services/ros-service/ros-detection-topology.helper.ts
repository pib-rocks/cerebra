import * as ROSLIB from "roslib";
import {BehaviorSubject, Subject} from "rxjs";
import {DetectionArray} from "../../ros-types/msg/detection-array";
import {rosDataTypes} from "../../ros-types/path/ros-datatypes.enum";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {RosTopicOptions} from "./ros-topic-wiring.helper";

export const DETECTION_DISCOVERY_POLL_MS = 15_000;
export const DETECTION_DISCOVERY_TIMEOUT_MS = 5_000;
export const DETECTION_DISCOVERY_INITIAL_BACKOFF_MS = 5_000;
export const DETECTION_DISCOVERY_MAX_BACKOFF_MS = 60_000;

export function modelIdFromTopic(topicName: string): string {
    return topicName.slice("/detections/".length);
}

export interface RosDetectionTopologyHost {
    ros: ROSLIB.Ros;
    detectionTopics: Map<string, ROSLIB.Topic<DetectionArray>>;
    detectionReceiver$: Subject<DetectionArray>;
    detectionModelsReceiver$: BehaviorSubject<string[]>;
    detectionClearReceiver$: Subject<string | undefined>;
    detectionTopicRefreshTimer?: ReturnType<typeof setInterval>;
    detectionDiscoveryTimeoutTimer?: ReturnType<typeof setTimeout>;
    detectionDiscoveryGeneration: number;
    detectionDiscoveryInFlight: boolean;
    detectionDiscoveryFailureCount?: number;
    detectionDiscoveryBackoffUntil?: number;
    detectionDiscoveryErrorLogged?: boolean;
    createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
        options?: RosTopicOptions,
    ): ROSLIB.Topic<T>;
}

function clearDetectionDiscoveryTimeout(host: RosDetectionTopologyHost): void {
    if (host.detectionDiscoveryTimeoutTimer !== undefined) {
        clearTimeout(host.detectionDiscoveryTimeoutTimer);
        host.detectionDiscoveryTimeoutTimer = undefined;
    }
}

export function stopDetectionTopicDiscovery(
    host: RosDetectionTopologyHost,
): void {
    if (host.detectionTopicRefreshTimer !== undefined) {
        clearInterval(host.detectionTopicRefreshTimer);
        host.detectionTopicRefreshTimer = undefined;
    }
    clearDetectionDiscoveryTimeout(host);
    host.detectionDiscoveryInFlight = false;
    host.detectionDiscoveryFailureCount = 0;
    host.detectionDiscoveryBackoffUntil = 0;
    host.detectionDiscoveryErrorLogged = false;
}

export function clearDetectionTopics(host: RosDetectionTopologyHost): void {
    for (const topic of host.detectionTopics.values()) {
        topic.unsubscribe();
    }
    host.detectionTopics.clear();
    host.detectionModelsReceiver$.next([]);
    host.detectionClearReceiver$.next(undefined);
}

export function syncDetectionTopics(
    host: RosDetectionTopologyHost,
    topicNames: string[],
): void {
    const currentTopicNames = new Set(topicNames);

    for (const [topicName, topic] of host.detectionTopics) {
        if (!currentTopicNames.has(topicName)) {
            topic.unsubscribe();
            host.detectionTopics.delete(topicName);
            host.detectionClearReceiver$.next(modelIdFromTopic(topicName));
        }
    }

    for (const topicName of currentTopicNames) {
        if (host.detectionTopics.has(topicName)) continue;

        const topic = host.createRosTopic<DetectionArray>(
            topicName,
            rosDataTypes.detectionArray,
            {throttle_rate: 50, queue_length: 1},
        );
        topic.subscribe((message) => {
            const detectionArray = message as DetectionArray;
            if (!detectionArray.model_id) {
                detectionArray.model_id = modelIdFromTopic(topicName);
            }
            host.detectionReceiver$.next(detectionArray);
        });
        host.detectionTopics.set(topicName, topic);
    }

    const modelIds = [...currentTopicNames]
        .map((topicName) => modelIdFromTopic(topicName))
        .sort((left, right) => left.localeCompare(right));
    if (
        modelIds.join("\0") !== host.detectionModelsReceiver$.value.join("\0")
    ) {
        host.detectionModelsReceiver$.next(modelIds);
    }
}

function handleDetectionDiscoveryFailure(
    host: RosDetectionTopologyHost,
    generation: number,
    error: unknown,
): void {
    if (generation !== host.detectionDiscoveryGeneration) return;
    clearDetectionDiscoveryTimeout(host);
    host.detectionDiscoveryInFlight = false;
    const failures = (host.detectionDiscoveryFailureCount ?? 0) + 1;
    host.detectionDiscoveryFailureCount = failures;
    const backoffMs = Math.min(
        DETECTION_DISCOVERY_MAX_BACKOFF_MS,
        DETECTION_DISCOVERY_INITIAL_BACKOFF_MS * Math.pow(2, failures - 1),
    );
    host.detectionDiscoveryBackoffUntil = Date.now() + backoffMs;
    if (!host.detectionDiscoveryErrorLogged) {
        host.detectionDiscoveryErrorLogged = true;
        console.error(
            `Could not discover detection topics (backing off for ${backoffMs} ms):`,
            error,
        );
    }
}

export function refreshDetectionTopics(
    host: RosDetectionTopologyHost,
    options?: {force?: boolean},
): void {
    if (host.detectionDiscoveryInFlight) return;
    const backoffUntil = host.detectionDiscoveryBackoffUntil ?? 0;
    if (!options?.force && backoffUntil > Date.now()) return;

    host.detectionDiscoveryInFlight = true;
    const generation = ++host.detectionDiscoveryGeneration;
    clearDetectionDiscoveryTimeout(host);
    host.detectionDiscoveryTimeoutTimer = setTimeout(() => {
        handleDetectionDiscoveryFailure(
            host,
            generation,
            new Error(
                `rosapi/topics timed out after ${DETECTION_DISCOVERY_TIMEOUT_MS} ms`,
            ),
        );
    }, DETECTION_DISCOVERY_TIMEOUT_MS);

    host.ros.getTopics(
        ({topics}: {topics: string[]}) => {
            if (generation !== host.detectionDiscoveryGeneration) return;
            clearDetectionDiscoveryTimeout(host);
            host.detectionDiscoveryInFlight = false;
            host.detectionDiscoveryFailureCount = 0;
            host.detectionDiscoveryBackoffUntil = 0;
            host.detectionDiscoveryErrorLogged = false;
            syncDetectionTopics(
                host,
                topics.filter((topic) => topic.startsWith("/detections/")),
            );
        },
        (error) => {
            handleDetectionDiscoveryFailure(host, generation, error);
        },
    );
}

export function startDetectionTopicDiscovery(
    host: RosDetectionTopologyHost,
): void {
    stopDetectionTopicDiscovery(host);
    refreshDetectionTopics(host, {force: true});
    host.detectionTopicRefreshTimer = setInterval(
        () => refreshDetectionTopics(host),
        DETECTION_DISCOVERY_POLL_MS,
    );
}

export function subscribeModelStatusTopic(
    host: RosDetectionTopologyHost & {
        modelStatusTopic: ROSLIB.Topic<ModelStatusArray>;
        modelStatusReceiver$: BehaviorSubject<ModelStatusArray>;
        lastModelStatus?: string;
    },
): void {
    host.modelStatusTopic.subscribe((message) => {
        const serializedStatus = JSON.stringify(
            [...message.models]
                .sort((left, right) =>
                    left.model_id.localeCompare(right.model_id),
                )
                .map(({model_id, state, active}) => ({
                    model_id,
                    state,
                    active,
                })),
        );
        const statusChanged =
            host.lastModelStatus === undefined ||
            serializedStatus !== host.lastModelStatus;
        if (
            host.lastModelStatus !== undefined &&
            serializedStatus !== host.lastModelStatus
        ) {
            host.detectionClearReceiver$.next(undefined);
        }
        host.lastModelStatus = serializedStatus;
        host.modelStatusReceiver$.next(message);
        // Only query rosapi/topics when the model roster actually changed;
        // unchanged heartbeats must not hammer rosbridge/rosapi (PR-1830).
        if (statusChanged) {
            refreshDetectionTopics(host);
        }
    });
}
