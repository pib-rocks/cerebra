import * as ROSLIB from "roslib";
import {Subject} from "rxjs";
import {BehaviorSubject} from "rxjs";
import {DetectionArray} from "../../ros-types/msg/detection-array";
import {rosDataTypes} from "../../ros-types/path/ros-datatypes.enum";
import {ModelStatusArray} from "../../ros-types/msg/model-status";

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
    detectionDiscoveryGeneration: number;
    detectionDiscoveryInFlight: boolean;
    createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
    ): ROSLIB.Topic<T>;
}

export function stopDetectionTopicDiscovery(
    host: RosDetectionTopologyHost,
): void {
    if (host.detectionTopicRefreshTimer !== undefined) {
        clearInterval(host.detectionTopicRefreshTimer);
        host.detectionTopicRefreshTimer = undefined;
    }
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
        .sort();
    if (
        modelIds.join("\0") !== host.detectionModelsReceiver$.value.join("\0")
    ) {
        host.detectionModelsReceiver$.next(modelIds);
    }
}

export function refreshDetectionTopics(host: RosDetectionTopologyHost): void {
    if (host.detectionDiscoveryInFlight) return;
    host.detectionDiscoveryInFlight = true;
    const generation = ++host.detectionDiscoveryGeneration;
    host.ros.getTopics(
        ({topics}: {topics: string[]}) => {
            if (generation !== host.detectionDiscoveryGeneration) return;
            host.detectionDiscoveryInFlight = false;
            syncDetectionTopics(
                host,
                topics.filter((topic) => topic.startsWith("/detections/")),
            );
        },
        (error) => {
            if (generation === host.detectionDiscoveryGeneration) {
                host.detectionDiscoveryInFlight = false;
            }
            console.error("Could not discover detection topics:", error);
        },
    );
}

export function startDetectionTopicDiscovery(
    host: RosDetectionTopologyHost,
): void {
    stopDetectionTopicDiscovery(host);
    refreshDetectionTopics(host);
    host.detectionTopicRefreshTimer = setInterval(
        () => refreshDetectionTopics(host),
        1000,
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
        if (
            host.lastModelStatus !== undefined &&
            serializedStatus !== host.lastModelStatus
        ) {
            host.detectionClearReceiver$.next(undefined);
        }
        host.lastModelStatus = serializedStatus;
        host.modelStatusReceiver$.next(message);
        refreshDetectionTopics(host);
    });
}
