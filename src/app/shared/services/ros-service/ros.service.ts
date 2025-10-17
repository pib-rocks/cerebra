import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {
    BehaviorSubject,
    Subject,
    ReplaySubject,
    Observable,
    filter,
    from,
    map,
} from "rxjs";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {DiagnosticStatus} from "../../ros-types/msg/diagnostic-status.message";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {rosDataTypes} from "../../ros-types/path/ros-datatypes.enum";
import {rosTopics} from "../../ros-types/path/ros-topics.enum";
import {rosServices} from "../../ros-types/path/ros-services.enum";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-types/srv/set-voice-assistant-state";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {GetVoiceAssistantStateResponse} from "../../ros-types/srv/get-voice-assistant-state";
import {MotorSettingsError} from "../../error/motor-settings-error";
import {
    ApplyMotorSettingsRequest,
    ApplyMotorSettingsResponse,
} from "../../ros-types/srv/apply-motor-settings";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {
    ProxyRunProgramStartRequest,
    ProxyRunProgramStartResponse,
} from "../../ros-types/srv/proxy-run-program-start";
import {ProxyRunProgramStopRequest} from "../../ros-types/srv/proxy-run-program-stop";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {IRosService} from "./i-ros-service";
import config from "../../../global-conf.json";
import {
    SendChatMessageRequest,
    SendChatMessageResponse,
} from "../../ros-types/srv/send-chat-message";
import {ChatIsListening} from "../../ros-types/msg/chat-is-listening";
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
import {ProgramInput} from "../../ros-types/msg/program-input";
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";
import {
    SetSolidStateRelayStateRequest,
    SetSolidStateRelayStateResponse,
} from "../../ros-types/srv/set-solid-state-relay-state";

@Injectable({
    providedIn: "root",
})
export class RosService implements IRosService {
    currentReceiver$: Subject<DiagnosticStatus> =
        new Subject<DiagnosticStatus>();
    cameraTimerPeriodReceiver$: BehaviorSubject<number> =
        new BehaviorSubject<number>(0.1);
    cameraReceiver$: Subject<string> = new Subject<string>();
    cameraPreviewSizeReceiver$: BehaviorSubject<number[]> = new BehaviorSubject<
        number[]
    >([0, 0]);
    cameraQualityFactorReceiver$: BehaviorSubject<number> =
        new BehaviorSubject<number>(80);
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage> =
        new Subject<JointTrajectoryMessage>();
    motorSettingsReceiver$: Subject<MotorSettingsMessage> =
        new Subject<MotorSettingsMessage>();
    proxyRunProgramFeedbackReceiver$: Subject<ProxyRunProgramFeedback> =
        new Subject<ProxyRunProgramFeedback>();
    proxyRunProgramResultReceiver$: Subject<ProxyRunProgramResult> =
        new Subject<ProxyRunProgramResult>();
    proxyRunProgramStatusReceiver$: Subject<ProxyRunProgramStatus> =
        new Subject<ProxyRunProgramStatus>();
    chatIsListeningReceiver$: Subject<ChatIsListening> =
        new Subject<ChatIsListening>();
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState> =
        new BehaviorSubject<VoiceAssistantState>({
            turned_on: false,
            chat_id: "",
        });
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();
    solidStateRelayStateReceiver$: BehaviorSubject<
        SolidStateRelayState | undefined
    > = new BehaviorSubject<SolidStateRelayState | undefined>(undefined);

    private ros!: ROSLIB.Ros;

    private motorCurrentTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private cameraTimerPeriodTopic!: ROSLIB.Topic;
    private cameraPreviewSizeTopic!: ROSLIB.Topic;
    private cameraQualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;
    private motorSettingsTopic!: ROSLIB.Topic;
    private deleteTokenTopic!: ROSLIB.Topic;
    private proxyRunProgramFeedbackTopic!: ROSLIB.Topic<ProxyRunProgramFeedback>;
    private proxyRunProgramResultTopic!: ROSLIB.Topic<ProxyRunProgramResult>;
    private proxyRunProgramStatusTopic!: ROSLIB.Topic<ProxyRunProgramStatus>;
    private programInputTopic!: ROSLIB.Topic<ProgramInput>;
    private chatMessageTopic!: ROSLIB.Topic<ChatMessage>;
    private voiceAssistantStateTopic!: ROSLIB.Topic<VoiceAssistantState>;
    private chatIsListeningTopic!: ROSLIB.Topic<ChatIsListening>;
    private solidStateRelayStateTopic!: ROSLIB.Topic<SolidStateRelayState>;

    private existTokenService!: ROSLIB.Service<
        Record<string, never>,
        ExistTokenResponse
    >;
    private encryptTokenService!: ROSLIB.Service<
        EncryptTokenRequest,
        EncryptTokenResponse
    >;
    private decryptTokenService!: ROSLIB.Service<
        DecryptTokenRequest,
        DecryptTokenResponse
    >;
    private setVoiceAssistantStateService!: ROSLIB.Service<
        SetVoiceAssistantStateRequest,
        SetVoiceAssistantStateResponse
    >;
    private getChatIsListeningService!: ROSLIB.Service<
        GetChatIsListeningRequest,
        GetChatIsListeningResponse
    >;
    private sendChatMessageService!: ROSLIB.Service<
        SendChatMessageRequest,
        SendChatMessageResponse
    >;
    private applyMotorSettingsService!: ROSLIB.Service<
        ApplyMotorSettingsRequest,
        ApplyMotorSettingsResponse
    >;
    private proxyProgramStartService!: ROSLIB.Service<
        ProxyRunProgramStartRequest,
        ProxyRunProgramStartResponse
    >;
    private proxyProgramStopService!: ROSLIB.Service<
        ProxyRunProgramStopRequest,
        Record<string, never>
    >;
    private applyJointTrajectoryService!: ROSLIB.Service<
        ApplyJointTrajectoryRequest,
        ApplyJointTrajectoryResponse
    >;

    private setSolidStateRelayStateService!: ROSLIB.Service<
        SetSolidStateRelayStateRequest,
        SetSolidStateRelayStateResponse
    >;

    private runProgramAction!: ROSLIB.ActionClient;

    constructor() {
        this.ros = this.setUpRos();
        this.ros.on("connection", () => {
            console.log("Connected to ROS");
            this.initTopicsAndServices();
            this.initSubscribers();
        });
        this.ros.on("error", (error: string) => {
            console.log("Error connecting to ROSBridge server:", error);
        });

        this.ros.on("close", () => {
            console.log("Disconnected from ROSBridge server.");
        });
    }

    private setUpRos() {
        let rosUrl: string;
        if (isDevMode()) {
            rosUrl = config.ip;
        } else {
            rosUrl = window.location.hostname;
        }
        return new ROSLIB.Ros({
            url: `ws://${rosUrl}:${config.portWebsocket}`,
        });
    }

    private initTopicsAndServices() {
        this.cameraTopic = this.createRosTopic(
            rosTopics.cameraTopicName,
            rosDataTypes.string,
        );
        this.cameraQualityFactorTopic = this.createRosTopic(
            rosTopics.cameraQualityTopic,
            rosDataTypes.int32,
        );
        this.cameraPreviewSizeTopic = this.createRosTopic(
            rosTopics.cameraPreviewSizeTopicName,
            rosDataTypes.int32MultiArray,
        );
        this.cameraTimerPeriodTopic = this.createRosTopic(
            rosTopics.cameraTimerPeriodTopicName,
            rosDataTypes.float64,
        );
        this.motorCurrentTopic = this.createRosTopic(
            rosTopics.motorCurrentTopicName,
            rosDataTypes.diagnosticStatus,
        );
        this.jointTrajectoryTopic = this.createRosTopic(
            rosTopics.jointTrajectoryTopicName,
            rosDataTypes.jointTrajectory,
        );
        this.chatMessageTopic = this.createRosTopic(
            rosTopics.chatMessages,
            rosDataTypes.chatMessage,
        );
        this.voiceAssistantStateTopic = this.createRosTopic(
            rosTopics.voiceAssistantState,
            rosDataTypes.voiceAssistantState,
        );
        this.chatIsListeningTopic = this.createRosTopic(
            rosTopics.chatIsListening,
            rosDataTypes.chatIsListening,
        );
        this.motorSettingsTopic = this.createRosTopic(
            rosTopics.motorSettingsTopicName,
            rosDataTypes.motorSettings,
        );
        this.proxyRunProgramFeedbackTopic = this.createRosTopic(
            rosTopics.proxyRunProgramFeedback,
            rosDataTypes.proxyRunProgramFeedback,
        );
        this.proxyRunProgramResultTopic = this.createRosTopic(
            rosTopics.proxyRunProgramResult,
            rosDataTypes.proxyRunProgramResult,
        );
        this.programInputTopic = this.createRosTopic(
            rosTopics.programInput,
            rosDataTypes.programInput,
        );
        this.proxyRunProgramStatusTopic = this.createRosTopic(
            rosTopics.proxyRunProgramStatus,
            rosDataTypes.proxyRunProgramStatus,
        );
        this.deleteTokenTopic = this.createRosTopic(
            rosTopics.deleteTokenTopic,
            rosDataTypes.empty,
        );
        this.solidStateRelayStateTopic = this.createRosTopic(
            rosTopics.solidStateRelayState,
            rosDataTypes.solidStateRelayState,
        );

        this.applyMotorSettingsService = this.createRosService(
            rosServices.applyMotorSettings,
            rosDataTypes.applyMotorSettings,
        );
        this.proxyProgramStartService = this.createRosService(
            rosServices.proxyRunProgramStart,
            rosDataTypes.proxyRunProgramStart,
        );
        this.proxyProgramStopService = this.createRosService(
            rosServices.proxyRunProgramStop,
            rosDataTypes.proxyRunProgramStop,
        );
        this.setVoiceAssistantStateService = this.createRosService(
            rosServices.setVoiceAssistantState,
            rosDataTypes.setVoiceAssistantState,
        );
        this.sendChatMessageService = this.createRosService(
            rosServices.sendChatMessage,
            rosDataTypes.sendChatMessage,
        );
        this.getChatIsListeningService = this.createRosService(
            rosServices.getChatIsListening,
            rosDataTypes.getChatIsListening,
        );
        this.applyJointTrajectoryService = this.createRosService(
            rosServices.applyJointTrajectory,
            rosDataTypes.applyJointTrajectory,
        );
        this.existTokenService = this.createRosService(
            rosServices.get_token_exists,
            rosDataTypes.get_token_exists,
        );
        this.encryptTokenService = this.createRosService(
            rosServices.encryptToken,
            rosDataTypes.encryptToken,
        );
        this.decryptTokenService = this.createRosService(
            rosServices.decryptToken,
            rosDataTypes.decryptToken,
        );
        this.setSolidStateRelayStateService = this.createRosService(
            rosServices.setSolidStateRelayState,
            rosDataTypes.setSolidStateRelayState,
        );
    }

    private createRosService(
        serviceName: string,
        serviceType: string,
    ): ROSLIB.Service {
        return new ROSLIB.Service({
            ros: this.ros,
            name: serviceName,
            serviceType: serviceType,
        });
    }

    private createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
    ): ROSLIB.Topic<T> {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: topicName,
            messageType: topicMessageType,
        });
    }

    private initSubscribers() {
        this.subscribeDefaultRosMessageTopic(
            this.cameraPreviewSizeTopic,
            this.cameraPreviewSizeReceiver$,
        );
        this.subscribeDefaultRosMessageTopic(
            this.cameraTimerPeriodTopic,
            this.cameraTimerPeriodReceiver$,
        );
        this.subscribeDefaultRosMessageTopic(
            this.cameraQualityFactorTopic,
            this.cameraQualityFactorReceiver$,
        );

        this.subscribeVoiceAssistantStateTopic();
        this.subscribeChatIsListeningTopic();
        this.subscribeChatMessageTopic();
        this.subscribeMotorSettingsTopic();
        this.subscribeMotorCurrentTopic();
        this.subscribeJointTrajectoryTopic();
        this.subscribeProxyRunProgramFeedbackTopic();
        this.subscribeProxyRunProgramResultTopic();
        this.subscribeProxyRunProgramStatusTopic();
        this.subscribeSolidStateRelayStateTopic();
    }

    private subscribeDefaultRosMessageTopic(
        topic: ROSLIB.Topic,
        receiver$: Subject<any>,
    ) {
        topic.subscribe((message: any) => {
            receiver$.next(message.data);
        });
    }

    //Has its own method to make it accessible by the camera components "startCamera" method
    subscribeCameraTopic() {
        this.subscribeDefaultRosMessageTopic(
            this.cameraTopic,
            this.cameraReceiver$,
        );
    }

    unsubscribeCameraTopic() {
        this.cameraTopic.unsubscribe();
    }

    private subscribeJointTrajectoryTopic() {
        this.jointTrajectoryTopic.subscribe((jointTrajectoryMessage) => {
            this.jointTrajectoryReceiver$.next(
                jointTrajectoryMessage as JointTrajectoryMessage,
            );
        });
    }

    private subscribeMotorSettingsTopic() {
        this.motorSettingsTopic.subscribe((message) => {
            this.motorSettingsReceiver$.next(message as MotorSettingsMessage);
        });
    }

    private subscribeMotorCurrentTopic() {
        this.motorCurrentTopic.subscribe((message) => {
            this.currentReceiver$.next(message as DiagnosticStatus);
        });
    }

    private subscribeProxyRunProgramStatusTopic() {
        this.proxyRunProgramStatusTopic.subscribe((message) => {
            this.proxyRunProgramStatusReceiver$.next(message);
        });
    }

    private subscribeProxyRunProgramFeedbackTopic() {
        this.proxyRunProgramFeedbackTopic.subscribe((message) => {
            this.proxyRunProgramFeedbackReceiver$.next(message);
        });
    }

    private subscribeProxyRunProgramResultTopic() {
        this.proxyRunProgramResultTopic.subscribe((message) => {
            this.proxyRunProgramResultReceiver$.next(message);
        });
    }

    private subscribeVoiceAssistantStateTopic() {
        this.voiceAssistantStateTopic.subscribe((message: any) => {
            this.voiceAssistantStateReceiver$.next(message);
        });
        const getVoiceAssistantStateService: ROSLIB.Service<
            Record<string, never>,
            GetVoiceAssistantStateResponse
        > = this.createRosService(
            rosServices.getVoiceAssistantState,
            rosDataTypes.getVoiceAssistantState,
        );
        getVoiceAssistantStateService.callService(
            {},
            (response) =>
                this.voiceAssistantStateReceiver$.next(
                    response.voice_assistant_state,
                ),
            (error: any) => console.error("error occured: " + error),
        );
    }

    private subscribeChatMessageTopic() {
        this.chatMessageTopic.subscribe((message: any) => {
            this.chatMessageReceiver$.next(message);
        });
    }
    private subscribeChatIsListeningTopic() {
        this.chatIsListeningTopic.subscribe((message: ChatIsListening) => {
            this.chatIsListeningReceiver$.next(message);
        });
    }
    private subscribeSolidStateRelayStateTopic() {
        this.solidStateRelayStateTopic.subscribe(
            (message: SolidStateRelayState) => {
                this.solidStateRelayStateReceiver$.next(message);
            },
        );
    }

    checkTokenExists(): Observable<ExistTokenResponse> {
        const failedResponse: ExistTokenResponse = {
            token_exists: false,
            token_active: false,
        };
        const subject: Subject<ExistTokenResponse> = new ReplaySubject();
        if (this.existTokenService === undefined) {
            subject.next(failedResponse);
            return subject;
        }

        const successCallback = (response: ExistTokenResponse) => {
            subject.next(response);
        };
        const errorCallback = (error: any) => {
            subject.next(failedResponse);
        };
        this.existTokenService.callService({}, successCallback, errorCallback);

        return subject;
    }

    deleteTokenMessage() {
        const message = new ROSLIB.Message({});
        this.deleteTokenTopic.publish(message);
    }

    encryptToken(token: string, password: string): Observable<boolean> {
        const subject: Subject<boolean> = new ReplaySubject();
        if (this.encryptTokenService === undefined) {
            subject.next(false);
            return subject;
        }

        const request: EncryptTokenRequest = {
            token: token,
            password: password,
        };

        const successCallback = (response: DecryptTokenResponse) => {
            subject.next(response.successful);
        };
        const errorCallback = (error: any) => {
            subject.next(false);
        };

        this.encryptTokenService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    decryptToken(password: string): Observable<boolean> {
        const subject: Subject<boolean> = new ReplaySubject();
        if (this.decryptTokenService === undefined) {
            subject.next(false);
            return subject;
        }
        const request: DecryptTokenRequest = {
            password: password,
        };

        const successCallback = (response: EncryptTokenResponse) => {
            subject.next(response.successful);
        };
        const errorCallback = (error: any) => {
            subject.next(false);
        };

        this.decryptTokenService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    setVoiceAssistantState(
        voiceAssistantState: VoiceAssistantState,
    ): Observable<void> {
        const subject: Subject<void> = new ReplaySubject();
        const request: SetVoiceAssistantStateRequest = {
            voice_assistant_state: voiceAssistantState,
        };
        const successCallback = (response: SetVoiceAssistantStateResponse) => {
            if (response.successful) {
                subject.next();
            } else {
                subject.error(new Error("could not apply state..."));
            }
        };
        const errorCallback = (error: any) => {
            subject.error(new Error(error));
        };
        this.setVoiceAssistantStateService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    setSolidStateRelayState(
        solidStateRelayState: SolidStateRelayState,
    ): Observable<void> {
        const subject: Subject<void> = new ReplaySubject();
        const request: SetSolidStateRelayStateRequest = {
            solid_state_relay_state: solidStateRelayState,
        };
        const successCallback = (response: SetSolidStateRelayStateResponse) => {
            if (response.successful) {
                subject.next();
            } else {
                subject.error(
                    new Error("could not apply solid state relay state..."),
                );
            }
        };
        const errorCallback = (error: any) => {
            subject.error(new Error(error));
        };
        this.setSolidStateRelayStateService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    applyJointTrajectory(
        jointTrajectory: JointTrajectoryMessage,
    ): Observable<void> {
        const subject: Subject<void> = new ReplaySubject();
        const request: ApplyJointTrajectoryRequest = {
            joint_trajectory: jointTrajectory,
        };
        const successCallback = (response: ApplyJointTrajectoryResponse) => {
            if (response.successful) {
                subject.next();
            } else {
                subject.error(new Error("failed to apply joint-trajectory."));
            }
        };
        const errorCallback = (error: any) => {
            subject.error(new Error(error));
        };
        this.applyJointTrajectoryService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    sendChatMessage(chatId: string, content: string): Observable<void> {
        const subject: Subject<void> = new ReplaySubject();
        const request: SendChatMessageRequest = {
            chat_id: chatId,
            content: content,
        };
        const successCallback = (response: SendChatMessageResponse) => {
            if (response.successful) {
                subject.next();
            } else {
                subject.error(new Error("failed to send message"));
            }
        };
        const errorCallback = (error: any) => {
            subject.error(new Error(error));
        };
        this.sendChatMessageService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    getChatIsListening(chatId: string): Observable<boolean> {
        const subject: Subject<boolean> = new ReplaySubject();
        const request: GetChatIsListeningRequest = {
            chat_id: chatId,
        };
        const successCallback = (response: GetChatIsListeningResponse) => {
            subject.next(response.listening);
        };
        const errorCallback = (error: any) => {
            subject.error(new Error(error));
        };
        this.getChatIsListeningService.callService(
            request,
            successCallback,
            errorCallback,
        );
        return subject;
    }

    applyMotorSettings(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        const subject: Subject<MotorSettingsMessage> = new ReplaySubject();
        try {
            this.applyMotorSettingsService.callService(
                {motor_settings: motorSettingsMessage},
                (response) => {
                    if (response["settings_applied"]) {
                        if (response["settings_persisted"]) {
                            subject.next(motorSettingsMessage);
                        } else {
                            subject.error(
                                new MotorSettingsError(
                                    motorSettingsMessage,
                                    true,
                                ),
                            );
                        }
                    } else {
                        subject.error(
                            new MotorSettingsError(motorSettingsMessage, false),
                        );
                    }
                },
                (errorMsg) => {
                    subject.error(new Error(errorMsg));
                },
            );
        } catch (error) {
            subject.error(error);
        }
        return subject;
    }

    private getfilteredFeedback(
        proxyGoalId: string,
    ): Observable<RunProgramFeedback> {
        return this.proxyRunProgramFeedbackReceiver$.pipe(
            filter((output) => output.proxy_goal_id == proxyGoalId),
        );
    }

    private getFilteredResult(
        proxyGoalId: string,
    ): Observable<RunProgramResult> {
        return this.proxyRunProgramResultReceiver$.pipe(
            filter((result) => result.proxy_goal_id == proxyGoalId),
        );
    }

    private getfilteredStatus(proxyGoalId: string): Observable<number> {
        return this.proxyRunProgramStatusReceiver$
            .pipe(filter((status) => status.proxy_goal_id == proxyGoalId))
            .pipe(map((status) => status.status));
    }

    private getCancelFunction(proxyGoalId: string): () => void {
        return () => {
            this.proxyProgramStopService.callService(
                {proxy_goal_id: proxyGoalId},
                () => undefined,
                () => {
                    throw new Error("failed to cancel...");
                },
            );
        };
    }

    runProgram(
        programNumber: string,
    ): Observable<GoalHandle<RunProgramFeedback, RunProgramResult>> {
        return from(
            new Promise<GoalHandle<RunProgramFeedback, RunProgramResult>>(
                (resolve, reject) => {
                    this.proxyProgramStartService.callService(
                        {program_number: programNumber},
                        (response) => {
                            const proxyGoalId = response.proxy_goal_id;
                            resolve({
                                feedback: this.getfilteredFeedback(proxyGoalId),
                                result: this.getFilteredResult(proxyGoalId),
                                status: this.getfilteredStatus(proxyGoalId),
                                cancel: this.getCancelFunction(proxyGoalId),
                            });
                        },
                        (errorMsg) => {
                            reject(new Error(errorMsg));
                        },
                    );
                },
            ),
        );
    }

    setTimerPeriod(period: number) {
        if (!this.cameraTimerPeriodTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: period});
        this.cameraTimerPeriodTopic.publish(message);
    }

    setPreviewSize(width: number, height: number) {
        if (!this.cameraPreviewSizeTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: [width, height]});
        this.cameraPreviewSizeTopic.publish(message);
    }

    setQualityFactor(factor: number) {
        if (!this.cameraQualityFactorTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: factor});
        this.cameraQualityFactorTopic.publish(message);
    }

    publishProgramInput(input: string, mpid: number) {
        this.programInputTopic.publish({input, mpid});
    }
}
