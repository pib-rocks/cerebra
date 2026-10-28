import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {
    ApplyMotorSettingsRequest,
    ApplyMotorSettingsResponse,
} from "../../ros-types/srv/apply-motor-settings";
import {
    GetJointPositionRequest,
    GetJointPositionResponse,
} from "../../ros-types/srv/get-joint-position";
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
import {DetectionArray} from "../../ros-types/msg/detection-array";
import {ModelStatusArray} from "../../ros-types/msg/model-status";
import {ListModelsResponse, ModelInfo} from "../../ros-types/srv/list-models";
import {
    ModelActionResponse,
    StartModelRequest,
} from "../../ros-types/srv/start-model";
import {StopModelRequest} from "../../ros-types/srv/stop-model";
import {DiagnosticStatus} from "../../ros-types/msg/diagnostic-status.message";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-types/srv/set-voice-assistant-state";
import {attachRosConnectionHandlers} from "./ros-connection.helper";
import {
    refreshDetectionTopics,
    startDetectionTopicDiscovery,
    stopDetectionTopicDiscovery,
    subscribeModelStatusTopic,
    syncDetectionTopics,
} from "./ros-detection-topology.helper";
import {
    createRosService,
    createRosTopic,
    wireRosTopicsAndServices,
} from "./ros-topic-wiring.helper";
import {
    listModelsOnHost,
    runProgramOnHost,
    startModelOnHost,
    stopModelOnHost,
} from "./ros-run-program.helper";
import {
    publishDisplayTextOnHost,
    publishExpressionOnHost,
    publishProgramInputOnHost,
    setPreviewSizeOnHost,
    setQualityFactorOnHost,
    setTimerPeriodOnHost,
} from "./ros-publish.helper";
import {
    initRosTopicSubscribers,
    subscribeCameraTopicOnHost,
    subscribeSolidStateRelayStateTopicOnHost,
    subscribeVoiceAssistantStateTopicOnHost,
    unsubscribeCameraTopicOnHost,
} from "./ros-topic-subscriptions.helper";
import {
    applyJointTrajectoryOnHost,
    applyMotorSettingsOnHost,
    checkTokenExistsOnHost,
    decryptTokenOnHost,
    deleteTokenMessageOnHost,
    encryptTokenOnHost,
    getChatIsListeningOnHost,
    getJointPositionOnHost,
    sendChatMessageOnHost,
    setSolidStateRelayStateOnHost,
    setVoiceAssistantStateOnHost,
} from "./ros-service-api.helper";
import {RosServiceHost} from "./ros-service-host.type";

@Injectable({
    providedIn: "root",
})
export class RosService implements IRosService {
    /**
     * rosbridge CallService.default_call_service_timeout is 5 seconds when the
     * call omits timeout. Model start answers only after pipeline rebuild and
     * verification, so the call must carry a longer timeout or rosbridge
     * reports a failure while the model is still starting.
     */
    static readonly MODEL_LIFECYCLE_TIMEOUT_SECONDS = 90;
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
    voiceTurnTraceReceiver$: Subject<string> = new Subject<string>();
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState> =
        new BehaviorSubject<VoiceAssistantState>({
            turned_on: false,
            chat_id: "",
        });
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();
    solidStateRelayStateReceiver$: BehaviorSubject<
        SolidStateRelayState | undefined
    > = new BehaviorSubject<SolidStateRelayState | undefined>(undefined);
    detectionReceiver$ = new Subject<DetectionArray>();
    detectionModelsReceiver$ = new BehaviorSubject<string[]>([]);
    detectionClearReceiver$ = new Subject<string | undefined>();
    modelStatusReceiver$ = new BehaviorSubject<ModelStatusArray>({models: []});

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
    private voiceTurnTraceTopic!: ROSLIB.Topic<{data: string}>;
    private expressionTopic?: ROSLIB.Topic<{data: string}>;
    private displayTextTopic?: ROSLIB.Topic<{data: string}>;
    private solidStateRelayStateTopic!: ROSLIB.Topic<SolidStateRelayState>;
    private modelStatusTopic!: ROSLIB.Topic<ModelStatusArray>;
    private detectionTopics = new Map<string, ROSLIB.Topic<DetectionArray>>();
    private detectionTopicRefreshTimer?: ReturnType<typeof setInterval>;
    private detectionDiscoveryGeneration = 0;
    private detectionDiscoveryInFlight = false;
    private lastModelStatus?: string;
    private cameraSubscriptionRequested = false;
    private cameraTopicSubscribed = false;

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

    private getJointPositionService!: ROSLIB.Service<
        GetJointPositionRequest,
        GetJointPositionResponse
    >;

    private setSolidStateRelayStateService!: ROSLIB.Service<
        SetSolidStateRelayStateRequest,
        SetSolidStateRelayStateResponse
    >;
    private listModelsService!: ROSLIB.Service<
        Record<string, never>,
        ListModelsResponse
    >;
    private startModelService!: ROSLIB.Service<
        StartModelRequest,
        ModelActionResponse
    >;
    private stopModelService!: ROSLIB.Service<
        StopModelRequest,
        ModelActionResponse
    >;

    private connectionStatusSubject = new BehaviorSubject<boolean>(false);
    public connectionStatus$ = this.connectionStatusSubject.asObservable();

    private get host(): RosServiceHost {
        return this as unknown as RosServiceHost;
    }

    constructor() {
        this.ros = this.setUpRos();
        attachRosConnectionHandlers(this.host);
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
        wireRosTopicsAndServices(this.host);
    }

    private createRosService(serviceName: string, serviceType: string): any {
        return createRosService(this.ros, serviceName, serviceType);
    }

    private createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
    ): ROSLIB.Topic<T> {
        return createRosTopic(this.ros, topicName, topicMessageType);
    }

    private initSubscribers() {
        initRosTopicSubscribers(this.host);
    }

    private subscribeModelStatusTopic() {
        subscribeModelStatusTopic(this.host);
    }

    private startDetectionTopicDiscovery() {
        startDetectionTopicDiscovery(this.host);
    }

    private stopDetectionTopicDiscovery() {
        stopDetectionTopicDiscovery(this.host);
    }

    private refreshDetectionTopics() {
        refreshDetectionTopics(this.host);
    }

    private syncDetectionTopics(topicNames: string[]) {
        syncDetectionTopics(this.host, topicNames);
    }

    subscribeCameraTopic() {
        subscribeCameraTopicOnHost(this.host);
    }

    unsubscribeCameraTopic() {
        unsubscribeCameraTopicOnHost(this.host);
    }

    private subscribeVoiceAssistantStateTopic() {
        subscribeVoiceAssistantStateTopicOnHost(this.host);
    }

    private subscribeSolidStateRelayStateTopic() {
        subscribeSolidStateRelayStateTopicOnHost(this.host);
    }

    checkTokenExists(): Observable<ExistTokenResponse> {
        return checkTokenExistsOnHost(this.host);
    }

    deleteTokenMessage() {
        deleteTokenMessageOnHost(this.host);
    }

    encryptToken(token: string, password: string): Observable<boolean> {
        return encryptTokenOnHost(this.host, token, password);
    }

    decryptToken(password: string): Observable<boolean> {
        return decryptTokenOnHost(this.host, password);
    }

    setVoiceAssistantState(
        voiceAssistantState: VoiceAssistantState,
    ): Observable<void> {
        return setVoiceAssistantStateOnHost(this.host, voiceAssistantState);
    }

    setSolidStateRelayState(
        solidStateRelayState: SolidStateRelayState,
    ): Observable<void> {
        return setSolidStateRelayStateOnHost(this.host, solidStateRelayState);
    }

    listModels(): Observable<ListModelsResponse> {
        return listModelsOnHost(this.host);
    }

    startModel(model: ModelInfo, owner: string): Observable<void> {
        return startModelOnHost(
            this.host,
            model,
            owner,
            RosService.MODEL_LIFECYCLE_TIMEOUT_SECONDS,
        );
    }

    stopModel(modelId: string, owner: string): Observable<void> {
        return stopModelOnHost(
            this.host,
            modelId,
            owner,
            RosService.MODEL_LIFECYCLE_TIMEOUT_SECONDS,
        );
    }

    getJointPosition(jointName: string): Observable<number> {
        return getJointPositionOnHost(this.host, jointName);
    }

    applyJointTrajectory(
        jointTrajectory: JointTrajectoryMessage,
    ): Observable<void> {
        return applyJointTrajectoryOnHost(this.host, jointTrajectory);
    }

    sendChatMessage(chatId: string, content: string): Observable<void> {
        return sendChatMessageOnHost(this.host, chatId, content);
    }

    getChatIsListening(chatId: string): Observable<boolean> {
        return getChatIsListeningOnHost(this.host, chatId);
    }

    applyMotorSettings(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        return applyMotorSettingsOnHost(this.host, motorSettingsMessage);
    }

    runProgram(
        programNumber: string,
    ): Observable<GoalHandle<RunProgramFeedback, RunProgramResult>> {
        return runProgramOnHost(this.host, programNumber);
    }

    setTimerPeriod(period: number) {
        setTimerPeriodOnHost(this.host, period);
    }

    setPreviewSize(width: number, height: number) {
        setPreviewSizeOnHost(this.host, width, height);
    }

    setQualityFactor(factor: number) {
        setQualityFactorOnHost(this.host, factor);
    }

    publishProgramInput(input: string, mpid: number) {
        publishProgramInputOnHost(this.host, input, mpid);
    }

    publishExpression(expression: string): void {
        publishExpressionOnHost(this.host, expression);
    }

    publishDisplayText(text: string): void {
        publishDisplayTextOnHost(this.host, text);
    }
}
