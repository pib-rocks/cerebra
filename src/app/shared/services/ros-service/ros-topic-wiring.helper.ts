import * as ROSLIB from "roslib";
import {rosDataTypes} from "../../ros-types/path/ros-datatypes.enum";
import {rosTopics} from "../../ros-types/path/ros-topics.enum";
import {rosServices} from "../../ros-types/path/ros-services.enum";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {ChatIsListening} from "../../ros-types/msg/chat-is-listening";
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {ProgramInput} from "../../ros-types/msg/program-input";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-types/srv/set-voice-assistant-state";
import {
    ApplyMotorSettingsRequest,
    ApplyMotorSettingsResponse,
} from "../../ros-types/srv/apply-motor-settings";
import {
    GetJointPositionRequest,
    GetJointPositionResponse,
} from "../../ros-types/srv/get-joint-position";
import {
    ProxyRunProgramStartRequest,
    ProxyRunProgramStartResponse,
} from "../../ros-types/srv/proxy-run-program-start";
import {ProxyRunProgramStopRequest} from "../../ros-types/srv/proxy-run-program-stop";
import {
    SendChatMessageRequest,
    SendChatMessageResponse,
} from "../../ros-types/srv/send-chat-message";
import {
    GetChatIsListeningRequest,
    GetChatIsListeningResponse,
} from "../../ros-types/srv/get-chat-is-listening";
import {
    ApplyJointTrajectoryRequest,
    ApplyJointTrajectoryResponse,
} from "../../ros-types/srv/apply-joint-trajectory";
import {
    EncryptTokenRequest,
    EncryptTokenResponse,
} from "../../ros-types/srv/encrypt-token";
import {
    DecryptTokenRequest,
    DecryptTokenResponse,
} from "../../ros-types/srv/decrypt-token";
import {ExistTokenResponse} from "../../ros-types/srv/exist-token";
import {
    SetSolidStateRelayStateRequest,
    SetSolidStateRelayStateResponse,
} from "../../ros-types/srv/set-solid-state-relay-state";
import {ListModelsResponse} from "../../ros-types/srv/list-models";
import {
    ModelActionResponse,
    StartModelRequest,
} from "../../ros-types/srv/start-model";
import {StopModelRequest} from "../../ros-types/srv/stop-model";
import {JointStateMessage} from "../../ros-types/msg/joint-state-message";

export function createRosTopic<T>(
    ros: ROSLIB.Ros,
    topicName: string,
    topicMessageType: string,
): ROSLIB.Topic<T> {
    return new ROSLIB.Topic({
        ros,
        name: topicName,
        messageType: topicMessageType,
    });
}

export function createRosService<Req extends object, Res>(
    ros: ROSLIB.Ros,
    serviceName: string,
    serviceType: string,
): ROSLIB.Service<Req, Res> {
    return new ROSLIB.Service({
        ros,
        name: serviceName,
        serviceType: serviceType,
    });
}

export interface RosTopicServiceWiring {
    ros: ROSLIB.Ros;
    cameraTopicSubscribed: boolean;
    motorCurrentTopic: ROSLIB.Topic;
    cameraTimerPeriodTopic: ROSLIB.Topic;
    cameraPreviewSizeTopic: ROSLIB.Topic;
    cameraQualityFactorTopic: ROSLIB.Topic;
    jointTrajectoryTopic: ROSLIB.Topic;
    jointStatesTopic: ROSLIB.Topic<JointStateMessage>;
    motorSettingsTopic: ROSLIB.Topic;
    deleteTokenTopic: ROSLIB.Topic;
    proxyRunProgramFeedbackTopic: ROSLIB.Topic<ProxyRunProgramFeedback>;
    proxyRunProgramResultTopic: ROSLIB.Topic<ProxyRunProgramResult>;
    proxyRunProgramStatusTopic: ROSLIB.Topic<ProxyRunProgramStatus>;
    programInputTopic: ROSLIB.Topic<ProgramInput>;
    chatMessageTopic: ROSLIB.Topic<ChatMessage>;
    voiceAssistantStateTopic: ROSLIB.Topic<VoiceAssistantState>;
    chatIsListeningTopic: ROSLIB.Topic<ChatIsListening>;
    voiceTurnTraceTopic: ROSLIB.Topic<{data: string}>;
    expressionTopic?: ROSLIB.Topic<{data: string}>;
    displayTextTopic?: ROSLIB.Topic<{data: string}>;
    solidStateRelayStateTopic: ROSLIB.Topic<SolidStateRelayState>;
    modelStatusTopic: ROSLIB.Topic<ModelStatusArray>;
    applyMotorSettingsService: ROSLIB.Service<
        ApplyMotorSettingsRequest,
        ApplyMotorSettingsResponse
    >;
    proxyProgramStartService: ROSLIB.Service<
        ProxyRunProgramStartRequest,
        ProxyRunProgramStartResponse
    >;
    proxyProgramStopService: ROSLIB.Service<
        ProxyRunProgramStopRequest,
        Record<string, never>
    >;
    setVoiceAssistantStateService: ROSLIB.Service<
        SetVoiceAssistantStateRequest,
        SetVoiceAssistantStateResponse
    >;
    sendChatMessageService: ROSLIB.Service<
        SendChatMessageRequest,
        SendChatMessageResponse
    >;
    getChatIsListeningService: ROSLIB.Service<
        GetChatIsListeningRequest,
        GetChatIsListeningResponse
    >;
    applyJointTrajectoryService: ROSLIB.Service<
        ApplyJointTrajectoryRequest,
        ApplyJointTrajectoryResponse
    >;
    getJointPositionService: ROSLIB.Service<
        GetJointPositionRequest,
        GetJointPositionResponse
    >;
    existTokenService: ROSLIB.Service<
        Record<string, never>,
        ExistTokenResponse
    >;
    encryptTokenService: ROSLIB.Service<
        EncryptTokenRequest,
        EncryptTokenResponse
    >;
    decryptTokenService: ROSLIB.Service<
        DecryptTokenRequest,
        DecryptTokenResponse
    >;
    setSolidStateRelayStateService: ROSLIB.Service<
        SetSolidStateRelayStateRequest,
        SetSolidStateRelayStateResponse
    >;
    listModelsService: ROSLIB.Service<
        Record<string, never>,
        ListModelsResponse
    >;
    startModelService: ROSLIB.Service<StartModelRequest, ModelActionResponse>;
    stopModelService: ROSLIB.Service<StopModelRequest, ModelActionResponse>;
}

export function wireRosTopicsAndServices(target: RosTopicServiceWiring): void {
    target.cameraTopicSubscribed = false;
    const {ros} = target;
    const topic = (name: string, type: string): any =>
        createRosTopic(ros, name, type);
    const service = (name: string, type: string): any =>
        createRosService(ros, name, type);

    target.cameraQualityFactorTopic = topic(
        rosTopics.cameraQualityTopic,
        rosDataTypes.int32,
    );
    target.cameraPreviewSizeTopic = topic(
        rosTopics.cameraPreviewSizeTopicName,
        rosDataTypes.int32MultiArray,
    );
    target.cameraTimerPeriodTopic = topic(
        rosTopics.cameraTimerPeriodTopicName,
        rosDataTypes.float64,
    );
    target.motorCurrentTopic = topic(
        rosTopics.motorCurrentTopicName,
        rosDataTypes.diagnosticStatus,
    );
    target.jointTrajectoryTopic = topic(
        rosTopics.jointTrajectoryTopicName,
        rosDataTypes.jointTrajectory,
    );
    target.jointStatesTopic = topic(
        rosTopics.jointStates,
        rosDataTypes.jointState,
    );
    target.chatMessageTopic = topic(
        rosTopics.chatMessages,
        rosDataTypes.chatMessage,
    );
    target.voiceAssistantStateTopic = topic(
        rosTopics.voiceAssistantState,
        rosDataTypes.voiceAssistantState,
    );
    target.chatIsListeningTopic = topic(
        rosTopics.chatIsListening,
        rosDataTypes.chatIsListening,
    );
    target.voiceTurnTraceTopic = topic(
        rosTopics.voiceTurnTrace,
        rosDataTypes.string,
    );
    target.expressionTopic = topic(rosTopics.expression, rosDataTypes.string);
    target.displayTextTopic = topic(rosTopics.displayText, rosDataTypes.string);
    target.motorSettingsTopic = topic(
        rosTopics.motorSettingsTopicName,
        rosDataTypes.motorSettings,
    );
    target.proxyRunProgramFeedbackTopic = topic(
        rosTopics.proxyRunProgramFeedback,
        rosDataTypes.proxyRunProgramFeedback,
    );
    target.proxyRunProgramResultTopic = topic(
        rosTopics.proxyRunProgramResult,
        rosDataTypes.proxyRunProgramResult,
    );
    target.programInputTopic = topic(
        rosTopics.programInput,
        rosDataTypes.programInput,
    );
    target.proxyRunProgramStatusTopic = topic(
        rosTopics.proxyRunProgramStatus,
        rosDataTypes.proxyRunProgramStatus,
    );
    target.deleteTokenTopic = topic(
        rosTopics.deleteTokenTopic,
        rosDataTypes.empty,
    );
    target.solidStateRelayStateTopic = topic(
        rosTopics.solidStateRelayState,
        rosDataTypes.solidStateRelayState,
    );
    target.modelStatusTopic = topic(
        rosTopics.modelStatus,
        rosDataTypes.modelStatusArray,
    );

    target.applyMotorSettingsService = service(
        rosServices.applyMotorSettings,
        rosDataTypes.applyMotorSettings,
    );
    target.proxyProgramStartService = service(
        rosServices.proxyRunProgramStart,
        rosDataTypes.proxyRunProgramStart,
    );
    target.proxyProgramStopService = service(
        rosServices.proxyRunProgramStop,
        rosDataTypes.proxyRunProgramStop,
    );
    target.setVoiceAssistantStateService = service(
        rosServices.setVoiceAssistantState,
        rosDataTypes.setVoiceAssistantState,
    );
    target.sendChatMessageService = service(
        rosServices.sendChatMessage,
        rosDataTypes.sendChatMessage,
    );
    target.getChatIsListeningService = service(
        rosServices.getChatIsListening,
        rosDataTypes.getChatIsListening,
    );
    target.applyJointTrajectoryService = service(
        rosServices.applyJointTrajectory,
        rosDataTypes.applyJointTrajectory,
    );
    target.getJointPositionService = service(
        rosServices.getJointPosition,
        rosDataTypes.getJointPosition,
    );
    target.existTokenService = service(
        rosServices.get_token_exists,
        rosDataTypes.get_token_exists,
    );
    target.encryptTokenService = service(
        rosServices.encryptToken,
        rosDataTypes.encryptToken,
    );
    target.decryptTokenService = service(
        rosServices.decryptToken,
        rosDataTypes.decryptToken,
    );
    target.setSolidStateRelayStateService = service(
        rosServices.setSolidStateRelayState,
        rosDataTypes.setSolidStateRelayState,
    );
    target.listModelsService = service(
        rosServices.listModels,
        rosDataTypes.listModels,
    );
    target.startModelService = service(
        rosServices.startModel,
        rosDataTypes.startModel,
    );
    target.stopModelService = service(
        rosServices.stopModel,
        rosDataTypes.stopModel,
    );
}
