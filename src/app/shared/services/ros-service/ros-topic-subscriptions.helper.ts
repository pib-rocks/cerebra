import * as ROSLIB from "roslib";
import {Subject, BehaviorSubject} from "rxjs";
import {rosDataTypes} from "../../ros-types/path/ros-datatypes.enum";
import {rosServices} from "../../ros-types/path/ros-services.enum";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {DiagnosticStatus} from "../../ros-types/msg/diagnostic-status.message";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {ChatIsListening} from "../../ros-types/msg/chat-is-listening";
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {DetectionArray} from "../../ros-types/msg/detection-array";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {GetVoiceAssistantStateResponse} from "../../ros-types/srv/get-voice-assistant-state";
import {
    startDetectionTopicDiscovery,
    subscribeModelStatusTopic,
} from "./ros-detection-topology.helper";
import {RosTopicServiceWiring} from "./ros-topic-wiring.helper";

export interface RosTopicSubscriptionHost extends RosTopicServiceWiring {
    cameraSubscriptionRequested: boolean;
    cameraPreviewSizeReceiver$: BehaviorSubject<number[]>;
    cameraTimerPeriodReceiver$: BehaviorSubject<number>;
    cameraQualityFactorReceiver$: BehaviorSubject<number>;
    cameraReceiver$: Subject<string>;
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState>;
    chatIsListeningReceiver$: Subject<ChatIsListening>;
    voiceTurnTraceReceiver$: Subject<string>;
    chatMessageReceiver$: Subject<ChatMessage>;
    motorSettingsReceiver$: Subject<MotorSettingsMessage>;
    currentReceiver$: Subject<DiagnosticStatus>;
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage>;
    proxyRunProgramFeedbackReceiver$: Subject<ProxyRunProgramFeedback>;
    proxyRunProgramResultReceiver$: Subject<ProxyRunProgramResult>;
    proxyRunProgramStatusReceiver$: Subject<ProxyRunProgramStatus>;
    solidStateRelayStateReceiver$: BehaviorSubject<
        SolidStateRelayState | undefined
    >;
    detectionReceiver$: Subject<DetectionArray>;
    detectionModelsReceiver$: BehaviorSubject<string[]>;
    detectionClearReceiver$: Subject<string | undefined>;
    modelStatusReceiver$: BehaviorSubject<ModelStatusArray>;
    detectionTopics: Map<string, ROSLIB.Topic<DetectionArray>>;
    detectionTopicRefreshTimer?: ReturnType<typeof setInterval>;
    detectionDiscoveryGeneration: number;
    detectionDiscoveryInFlight: boolean;
    lastModelStatus?: string;
    createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
    ): ROSLIB.Topic<T>;
    createRosService<Req extends object, Res>(
        serviceName: string,
        serviceType: string,
    ): ROSLIB.Service<Req, Res>;
    subscribeCameraTopic(): void;
}

function subscribeDefaultRosMessageTopic(
    topic: ROSLIB.Topic,
    receiver$: Subject<any>,
) {
    topic.subscribe((message: any) => {
        receiver$.next(message.data);
    });
}

export function initRosTopicSubscribers(host: RosTopicSubscriptionHost): void {
    subscribeDefaultRosMessageTopic(
        host.cameraPreviewSizeTopic,
        host.cameraPreviewSizeReceiver$,
    );
    subscribeDefaultRosMessageTopic(
        host.cameraTimerPeriodTopic,
        host.cameraTimerPeriodReceiver$,
    );
    subscribeDefaultRosMessageTopic(
        host.cameraQualityFactorTopic,
        host.cameraQualityFactorReceiver$,
    );

    subscribeVoiceAssistantStateTopic(host);
    subscribeChatIsListeningTopic(host);
    subscribeVoiceTurnTraceTopic(host);
    subscribeChatMessageTopic(host);
    subscribeMotorSettingsTopic(host);
    subscribeMotorCurrentTopic(host);
    subscribeJointTrajectoryTopic(host);
    subscribeProxyRunProgramFeedbackTopic(host);
    subscribeProxyRunProgramResultTopic(host);
    subscribeProxyRunProgramStatusTopic(host);
    subscribeSolidStateRelayStateTopic(host);
    subscribeModelStatusTopic(host);
    startDetectionTopicDiscovery(host);
    if (host.cameraSubscriptionRequested) host.subscribeCameraTopic();
}

export function subscribeCameraTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.cameraSubscriptionRequested = true;
    host.cameraTopicSubscribed = true;
}

export function unsubscribeCameraTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.cameraSubscriptionRequested = false;
    host.cameraTopicSubscribed = false;
}

export function subscribeJointTrajectoryTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.jointTrajectoryTopic.subscribe((jointTrajectoryMessage) => {
        host.jointTrajectoryReceiver$.next(
            jointTrajectoryMessage as JointTrajectoryMessage,
        );
    });
}

export function subscribeMotorSettingsTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.motorSettingsTopic.subscribe((message) => {
        host.motorSettingsReceiver$.next(message as MotorSettingsMessage);
    });
}

export function subscribeMotorCurrentTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.motorCurrentTopic.subscribe((message) => {
        host.currentReceiver$.next(message as DiagnosticStatus);
    });
}

export function subscribeProxyRunProgramStatusTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.proxyRunProgramStatusTopic.subscribe((message) => {
        host.proxyRunProgramStatusReceiver$.next(message);
    });
}

export function subscribeProxyRunProgramFeedbackTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.proxyRunProgramFeedbackTopic.subscribe((message) => {
        host.proxyRunProgramFeedbackReceiver$.next(message);
    });
}

export function subscribeProxyRunProgramResultTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.proxyRunProgramResultTopic.subscribe((message) => {
        host.proxyRunProgramResultReceiver$.next(message);
    });
}

export function subscribeVoiceAssistantStateTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.voiceAssistantStateTopic.subscribe((message: any) => {
        host.voiceAssistantStateReceiver$.next(message);
    });
    const getVoiceAssistantStateService = host.createRosService<
        Record<string, never>,
        GetVoiceAssistantStateResponse
    >(rosServices.getVoiceAssistantState, rosDataTypes.getVoiceAssistantState);
    getVoiceAssistantStateService.callService(
        {},
        (response) =>
            host.voiceAssistantStateReceiver$.next(
                response.voice_assistant_state,
            ),
        (error: any) => console.error("error occured: " + error),
    );
}

export function subscribeChatMessageTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.chatMessageTopic.subscribe((message: any) => {
        host.chatMessageReceiver$.next(message);
    });
}

export function subscribeChatIsListeningTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.chatIsListeningTopic.subscribe((message: ChatIsListening) => {
        host.chatIsListeningReceiver$.next(message);
    });
}

export function subscribeVoiceTurnTraceTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.voiceTurnTraceTopic.subscribe((message: {data?: string}) => {
        const raw = typeof message?.data === "string" ? message.data : "";
        if (raw) {
            host.voiceTurnTraceReceiver$.next(raw);
        }
    });
}

export function subscribeSolidStateRelayStateTopicOnHost(
    host: RosTopicSubscriptionHost,
): void {
    host.solidStateRelayStateTopic.subscribe(
        (message: SolidStateRelayState) => {
            host.solidStateRelayStateReceiver$.next(message);
        },
    );
}

function subscribeJointTrajectoryTopic(host: RosTopicSubscriptionHost): void {
    subscribeJointTrajectoryTopicOnHost(host);
}

function subscribeMotorSettingsTopic(host: RosTopicSubscriptionHost): void {
    subscribeMotorSettingsTopicOnHost(host);
}

function subscribeMotorCurrentTopic(host: RosTopicSubscriptionHost): void {
    subscribeMotorCurrentTopicOnHost(host);
}

function subscribeProxyRunProgramStatusTopic(
    host: RosTopicSubscriptionHost,
): void {
    subscribeProxyRunProgramStatusTopicOnHost(host);
}

function subscribeProxyRunProgramFeedbackTopic(
    host: RosTopicSubscriptionHost,
): void {
    subscribeProxyRunProgramFeedbackTopicOnHost(host);
}

function subscribeProxyRunProgramResultTopic(
    host: RosTopicSubscriptionHost,
): void {
    subscribeProxyRunProgramResultTopicOnHost(host);
}

function subscribeVoiceAssistantStateTopic(
    host: RosTopicSubscriptionHost,
): void {
    subscribeVoiceAssistantStateTopicOnHost(host);
}

function subscribeChatMessageTopic(host: RosTopicSubscriptionHost): void {
    subscribeChatMessageTopicOnHost(host);
}

function subscribeChatIsListeningTopic(host: RosTopicSubscriptionHost): void {
    subscribeChatIsListeningTopicOnHost(host);
}

function subscribeVoiceTurnTraceTopic(host: RosTopicSubscriptionHost): void {
    subscribeVoiceTurnTraceTopicOnHost(host);
}

function subscribeSolidStateRelayStateTopic(
    host: RosTopicSubscriptionHost,
): void {
    subscribeSolidStateRelayStateTopicOnHost(host);
}
