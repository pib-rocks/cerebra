import {RosCameraPublishHost} from "./ros-publish.helper";
import {RosOneShotServiceHost} from "./ros-service-api.helper";
import {RosConnectionHost} from "./ros-connection.helper";
import {
    RosModelLifecycleHost,
    RosRunProgramHost,
} from "./ros-run-program.helper";
import {RosTopicSubscriptionHost} from "./ros-topic-subscriptions.helper";
import {RosTopicServiceWiring} from "./ros-topic-wiring.helper";

export type RosServiceHost = RosTopicServiceWiring &
    RosTopicSubscriptionHost &
    RosConnectionHost &
    RosOneShotServiceHost &
    RosModelLifecycleHost &
    RosRunProgramHost &
    RosCameraPublishHost & {
        initTopicsAndServices: () => void;
        initSubscribers: () => void;
        connectionStatusSubject: import("rxjs").BehaviorSubject<boolean>;
        subscribeModelStatusTopic: () => void;
        startDetectionTopicDiscovery: () => void;
        stopDetectionTopicDiscovery: () => void;
        refreshDetectionTopics: () => void;
        syncDetectionTopics: (topicNames: string[]) => void;
        subscribeVoiceAssistantStateTopic: () => void;
        subscribeSolidStateRelayStateTopic: () => void;
    };
