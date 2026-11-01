import * as ROSLIB from "roslib";
import {BehaviorSubject} from "rxjs";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {
    clearDetectionTopics,
    stopDetectionTopicDiscovery,
    RosDetectionTopologyHost,
} from "./ros-detection-topology.helper";

export interface RosConnectionHost extends RosDetectionTopologyHost {
    initTopicsAndServices: () => void;
    initSubscribers: () => void;
    connectionStatusSubject: BehaviorSubject<boolean>;
    modelStatusTopic?: ROSLIB.Topic<ModelStatusArray>;
    cameraTopicSubscribed: boolean;
    detectionDiscoveryGeneration: number;
    detectionDiscoveryInFlight: boolean;
    lastModelStatus?: string;
    modelStatusReceiver$: BehaviorSubject<ModelStatusArray>;
}

export function attachRosConnectionHandlers(host: RosConnectionHost): void {
    host.ros.on("connection", () => {
        console.log("Connected to ROS");
        host.initTopicsAndServices();
        host.initSubscribers();
        host.connectionStatusSubject.next(true);
    });
    host.ros.on("error", (error: unknown) => {
        console.log("Error connecting to ROSBridge server:", error);
        host.connectionStatusSubject.next(false);
    });
    host.ros.on("close", () => {
        console.log("Disconnected from ROSBridge server.");
        host.modelStatusTopic?.unsubscribe();
        stopDetectionTopicDiscovery(host);
        host.detectionDiscoveryGeneration++;
        host.detectionDiscoveryInFlight = false;
        clearDetectionTopics(host);
        host.lastModelStatus = undefined;
        host.modelStatusReceiver$.next({models: []});
        host.connectionStatusSubject.next(false);
    });
}
