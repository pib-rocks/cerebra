import * as ROSLIB from "roslib";
import {Observable, ReplaySubject} from "rxjs";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {centidegToRad} from "../../types/joint-angle-units";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";
import {ExistTokenResponse} from "../../ros-types/srv/exist-token";
import {
    EncryptTokenRequest,
    EncryptTokenResponse,
} from "../../ros-types/srv/encrypt-token";
import {
    DecryptTokenRequest,
    DecryptTokenResponse,
} from "../../ros-types/srv/decrypt-token";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-types/srv/set-voice-assistant-state";
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
    GetJointPositionRequest,
    GetJointPositionResponse,
} from "../../ros-types/srv/get-joint-position";
import {
    SetSolidStateRelayStateRequest,
    SetSolidStateRelayStateResponse,
} from "../../ros-types/srv/set-solid-state-relay-state";
import {
    ApplyMotorSettingsRequest,
    ApplyMotorSettingsResponse,
} from "../../ros-types/srv/apply-motor-settings";
import {
    callApplyMotorSettings$,
    callRosServiceBooleanFallback$,
    callRosServiceExistToken$,
    callRosServiceReplay$,
    callRosServiceVoidWhenSuccessful$,
    serviceErrorText,
} from "./ros-service-call.helper";

export interface RosOneShotServiceHost {
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
    setVoiceAssistantStateService: ROSLIB.Service<
        SetVoiceAssistantStateRequest,
        SetVoiceAssistantStateResponse
    >;
    setSolidStateRelayStateService: ROSLIB.Service<
        SetSolidStateRelayStateRequest,
        SetSolidStateRelayStateResponse
    >;
    getJointPositionService: ROSLIB.Service<
        GetJointPositionRequest,
        GetJointPositionResponse
    >;
    applyJointTrajectoryService: ROSLIB.Service<
        ApplyJointTrajectoryRequest,
        ApplyJointTrajectoryResponse
    >;
    sendChatMessageService: ROSLIB.Service<
        SendChatMessageRequest,
        SendChatMessageResponse
    >;
    getChatIsListeningService: ROSLIB.Service<
        GetChatIsListeningRequest,
        GetChatIsListeningResponse
    >;
    applyMotorSettingsService: ROSLIB.Service<
        ApplyMotorSettingsRequest,
        ApplyMotorSettingsResponse
    >;
    deleteTokenTopic: ROSLIB.Topic;
}

export function checkTokenExistsOnHost(
    host: RosOneShotServiceHost,
): Observable<ExistTokenResponse> {
    return callRosServiceExistToken$(host.existTokenService);
}

export function deleteTokenMessageOnHost(host: RosOneShotServiceHost): void {
    host.deleteTokenTopic.publish({});
}

export function encryptTokenOnHost(
    host: RosOneShotServiceHost,
    token: string,
    password: string,
): Observable<boolean> {
    return callRosServiceBooleanFallback$(
        host.encryptTokenService,
        {token, password},
        (response) => response.successful,
    );
}

export function decryptTokenOnHost(
    host: RosOneShotServiceHost,
    password: string,
): Observable<boolean> {
    return callRosServiceBooleanFallback$(
        host.decryptTokenService,
        {password},
        (response) => response.successful,
    );
}

export function setVoiceAssistantStateOnHost(
    host: RosOneShotServiceHost,
    voiceAssistantState: VoiceAssistantState,
): Observable<void> {
    return callRosServiceVoidWhenSuccessful$(
        host.setVoiceAssistantStateService,
        {voice_assistant_state: voiceAssistantState},
        "could not apply state...",
    );
}

export function setSolidStateRelayStateOnHost(
    host: RosOneShotServiceHost,
    solidStateRelayState: SolidStateRelayState,
): Observable<void> {
    return callRosServiceVoidWhenSuccessful$(
        host.setSolidStateRelayStateService,
        {solid_state_relay_state: solidStateRelayState},
        "could not apply solid state relay state...",
    );
}

export function getJointPositionOnHost(
    host: RosOneShotServiceHost,
    jointName: string,
): Observable<number> {
    return callRosServiceReplay$(
        host.getJointPositionService,
        {joint_name: jointName},
        {
            missingServiceError: "get_joint_position service is undefined",
            mapSuccess: (response) => {
                if (response.successful) {
                    return response.position;
                }
                throw new Error(
                    response.message || "failed to read joint position",
                );
            },
            mapError: (error) => {
                const message = (error as {message?: string} | null)?.message;
                return new Error(message || serviceErrorText(error));
            },
        },
    );
}

export function applyJointTrajectoryOnHost(
    host: RosOneShotServiceHost,
    jointTrajectory: JointTrajectoryMessage,
): Observable<void> {
    const rosJointTrajectory: JointTrajectoryMessage = {
        ...jointTrajectory,
        points: (jointTrajectory.points ?? []).map((point) => ({
            ...point,
            positions: (point.positions ?? []).map(centidegToRad),
        })),
    };
    return callRosServiceVoidWhenSuccessful$(
        host.applyJointTrajectoryService,
        {joint_trajectory: rosJointTrajectory},
        "failed to apply joint-trajectory.",
    );
}

export function sendChatMessageOnHost(
    host: RosOneShotServiceHost,
    chatId: string,
    content: string,
): Observable<void> {
    if (host.sendChatMessageService === undefined) {
        const subject = new ReplaySubject<void>(1);
        subject.error(new Error("Chat service is undefined"));
        return subject.asObservable();
    }
    return callRosServiceVoidWhenSuccessful$(
        host.sendChatMessageService,
        {chat_id: chatId, content},
        "failed to send message",
    );
}

export function getChatIsListeningOnHost(
    host: RosOneShotServiceHost,
    chatId: string,
): Observable<boolean> {
    return callRosServiceReplay$(
        host.getChatIsListeningService,
        {chat_id: chatId},
        {
            mapSuccess: (response) => response.listening,
        },
    );
}

export function applyMotorSettingsOnHost(
    host: RosOneShotServiceHost,
    motorSettingsMessage: MotorSettingsMessage,
): Observable<MotorSettingsMessage> {
    return callApplyMotorSettings$(
        host.applyMotorSettingsService,
        motorSettingsMessage,
    );
}
