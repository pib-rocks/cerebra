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
import {rosActions} from "../../ros-types/path/ros-actions.enum";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-types/srv/set-voice-assistant-state";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {GetVoiceAssistantStateResponse} from "../../ros-types/srv/get-voice-assistant-state";
import {MotorSettingsError} from "../../error/motor-settings-error";
import {
    MotorSettingsServiceRequest,
    MotorSettingsServiceResponse,
} from "../../ros-types/srv/motor-settings-service";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {
    ProxyRunProgramStartRequest,
    ProxyRunProgramStartResponse,
} from "../../ros-types/srv/proxy-run-program-start";
import {
    ProxyRunProgramStopRequest,
    ProxyRunProgramStopResponse,
} from "../../ros-types/srv/proxy-run-program-stop";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";

@Injectable({
    providedIn: "root",
})
export class RosService {
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
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState> =
        new BehaviorSubject<VoiceAssistantState>({
            turned_on: false,
            chat_id: "",
        });
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();

    private ros!: ROSLIB.Ros;

    private motorCurrentTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private cameraTimerPeriodTopic!: ROSLIB.Topic;
    private cameraPreviewSizeTopic!: ROSLIB.Topic;
    private cameraQualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;
    private motorSettingsTopic!: ROSLIB.Topic;
    private proxyRunProgramFeedbackTopic!: ROSLIB.Topic<ProxyRunProgramFeedback>;
    private proxyRunProgramResultTopic!: ROSLIB.Topic<ProxyRunProgramResult>;
    private proxyRunProgramStatusTopic!: ROSLIB.Topic<ProxyRunProgramStatus>;
    private chatMessageTopic!: ROSLIB.Topic<ChatMessage>;
    private voiceAssistantStateTopic!: ROSLIB.Topic<VoiceAssistantState>;

    private setVoiceAssistantStateService!: ROSLIB.Service<
        SetVoiceAssistantStateRequest,
        SetVoiceAssistantStateResponse
    >;
    private motorSettingsService!: ROSLIB.Service<
        MotorSettingsServiceRequest,
        MotorSettingsServiceResponse
    >;
    private proxyProgramStartService!: ROSLIB.Service<
        ProxyRunProgramStartRequest,
        ProxyRunProgramStartResponse
    >;
    private proxyProgramStopService!: ROSLIB.Service<
        ProxyRunProgramStopRequest,
        ProxyRunProgramStopResponse
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

    setUpRos() {
        let rosUrl: string;
        if (isDevMode()) {
            rosUrl = "127.0.0.1";
        } else {
            rosUrl = window.location.hostname;
        }
        return new ROSLIB.Ros({
            url: `ws://${rosUrl}:9090`,
        });
    }

    get Ros(): ROSLIB.Ros {
        return this.ros;
    }

    initTopicsAndServices() {
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
        this.proxyRunProgramStatusTopic = this.createRosTopic(
            rosTopics.proxyRunProgramStatus,
            rosDataTypes.proxyRunProgramStatus,
        );

        this.motorSettingsService = this.createRosService(
            rosServices.motorSettingsServiceName,
            rosDataTypes.motorSettingsSrv,
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

        this.runProgramAction = this.createActionClient(
            rosActions.runProgramName,
            rosDataTypes.runProgram,
        );
    }

    createRosService(serviceName: string, serviceType: string): ROSLIB.Service {
        return new ROSLIB.Service({
            ros: this.ros,
            name: serviceName,
            serviceType: serviceType,
        });
    }

    createRosTopic<T>(
        topicName: string,
        topicMessageType: string,
    ): ROSLIB.Topic<T> {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: topicName,
            messageType: topicMessageType,
        });
    }

    createActionClient(actionName: string, actionType: string) {
        return new ROSLIB.ActionClient({
            ros: this.ros,
            serverName: actionName,
            actionName: actionType,
        });
    }

    initSubscribers() {
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
        this.subscribeChatMessageTopic();
        this.subscribeMotorSettingsTopic();
        this.subscribeMotorCurrentTopic();
        this.subscribeJointTrajectoryTopic();
        this.subscribeProxyRunProgramFeedbackTopic();
        this.subscribeProxyRunProgramResultTopic();
        this.subscribeProxyRunProgramStatusTopic();
    }

    subscribeDefaultRosMessageTopic(
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

    subscribeJointTrajectoryTopic() {
        this.jointTrajectoryTopic.subscribe((jointTrajectoryMessage) => {
            this.jointTrajectoryReceiver$.next(
                jointTrajectoryMessage as JointTrajectoryMessage,
            );
        });
    }

    subscribeMotorSettingsTopic() {
        this.motorSettingsTopic.subscribe((message) => {
            this.motorSettingsReceiver$.next(message as MotorSettingsMessage);
        });
    }

    subscribeMotorCurrentTopic() {
        this.motorCurrentTopic.subscribe((message) => {
            this.currentReceiver$.next(message as DiagnosticStatus);
        });
    }

    subscribeProxyRunProgramStatusTopic() {
        this.proxyRunProgramStatusTopic.subscribe((message) => {
            this.proxyRunProgramStatusReceiver$.next(message);
        });
    }

    subscribeProxyRunProgramFeedbackTopic() {
        this.proxyRunProgramFeedbackTopic.subscribe((message) => {
            this.proxyRunProgramFeedbackReceiver$.next(message);
        });
    }

    subscribeProxyRunProgramResultTopic() {
        this.proxyRunProgramResultTopic.subscribe((message) => {
            this.proxyRunProgramResultReceiver$.next(message);
        });
    }

    subscribeVoiceAssistantStateTopic() {
        this.voiceAssistantStateTopic.subscribe((message: any) => {
            console.info("message: " + message);
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

    subscribeChatMessageTopic() {
        this.chatMessageTopic.subscribe((message: any) => {
            console.info("message: " + message);
            this.chatMessageReceiver$.next(message);
        });
    }

    unsubscribeCameraTopic() {
        this.cameraTopic.unsubscribe();
    }

    // sendActionGoal<RequestType, ResultType, FeedbackType>(
    //     request: RequestType,
    //     client: ROSLIB.ActionClient
    // ): GoalHandle<FeedbackType, ResultType> {

    //     const feedbackSubject = new Subject<FeedbackType>();
    //     const resultSubject = new Subject<ResultType>();
    //     const statusSubject = new Subject<void>();

    //     const goal = new ROSLIB.Goal({
    //         actionClient: client,
    //         goalMessage: request
    //     });

    //     console.info("SENDING GOAL")
    //     goal.send();

    //     goal.on('result', result => resultSubject.next(result))
    //     goal.on('feedback', feedback => feedbackSubject.next(feedback))
    //     goal.on('status', status => statusSubject.next(status))

    //     return {
    //         feedback: feedbackSubject,
    //         result: resultSubject,
    //         status: statusSubject,
    //     };
    // }

    // runProgram(programNumber: string): GoalHandle<RunProgramFeedback, RunProgramResult> {
    //     const request: RunProgramRequest = {
    //         program_number: programNumber
    //     };
    //     return this.sendActionGoal(request, this.runProgramAction);
    // }

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

    sendMotorSettingsMessage(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        const subject: Subject<MotorSettingsMessage> = new ReplaySubject();
        this.motorSettingsService.callService(
            {motor_settings: motorSettingsMessage},
            (response) => {
                if (response["settings_applied"]) {
                    if (response["settings_persisted"]) {
                        subject.next(motorSettingsMessage);
                    } else {
                        subject.error(
                            new MotorSettingsError(motorSettingsMessage, true),
                        );
                        throw Error("Settings couldn't be persisted");
                    }
                } else {
                    subject.error(
                        new MotorSettingsError(motorSettingsMessage, false),
                    );
                    throw Error("Settings couldn't be applied");
                }
            },
            (errorMsg) => {
                subject.error(new Error(errorMsg));
            },
        );
        return subject;
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
                            const id = response.proxy_goal_id;
                            const feedback: Observable<RunProgramFeedback> =
                                this.proxyRunProgramFeedbackReceiver$.pipe(
                                    filter(
                                        (output) => output.proxy_goal_id == id,
                                    ),
                                );
                            const result: Observable<RunProgramResult> =
                                this.proxyRunProgramResultReceiver$.pipe(
                                    filter(
                                        (exitCode) =>
                                            exitCode.proxy_goal_id == id,
                                    ),
                                );
                            const status: Observable<number> =
                                this.proxyRunProgramStatusReceiver$
                                    .pipe(
                                        filter(
                                            (status) =>
                                                status.proxy_goal_id == id,
                                        ),
                                    )
                                    .pipe(map((status) => status.status));
                            const cancel = () =>
                                this.proxyProgramStopService.callService(
                                    {proxy_goal_id: id},
                                    () => {},
                                );
                            resolve({feedback, result, status, cancel});
                        },
                        (errorMsg) => {
                            reject(new Error(errorMsg));
                        },
                    );
                },
            ),
        );
    }

    sendJointTrajectoryMessage(jointTrajectoryMessage: JointTrajectoryMessage) {
        const message = new ROSLIB.Message(jointTrajectoryMessage);
        this.jointTrajectoryTopic.publish(message);
    }

    //Remove this function after establishing a new test concept
    sendJointTrajectoryConsoleLog(
        sentReceivedPrefix: string,
        jtMessage: ROSLIB.Message,
    ) {
        const jsonJtString = JSON.stringify(jtMessage);
        const parsedJtJson = JSON.parse(jsonJtString) as JointTrajectoryMessage;
        for (const index in parsedJtJson.joint_names) {
            console.log(
                sentReceivedPrefix +
                    " jtMessage for motor: " +
                    parsedJtJson.joint_names[index] +
                    " position: " +
                    parsedJtJson.points[index].positions,
            );
        }
    }

    //Remove this function after establishing a new test concept
    sendMotorSettingsConsoleLog(
        sentReceivedPrefix: string,
        motorSettingsMessage: ROSLIB.Message,
    ) {
        const jsonStr = JSON.stringify(motorSettingsMessage);
        const json = JSON.parse(jsonStr);
        const jsonArray = JSON.parse(json["data"]);
        const jsonObject = jsonArray.reduce((key: object, value: object) => {
            return {...key, ...value};
        }, {});

        let consoleString =
            sentReceivedPrefix +
            " settings message for motorName: " +
            jsonObject.motorName +
            ", turnedOn: " +
            jsonObject.turnedOn;

        if (jsonObject.turnedOn) {
            consoleString =
                consoleString +
                ", pulse_widths_min: " +
                jsonObject.pulse_widths_min +
                ", pulse_widths_max: " +
                jsonObject.pulse_widths_max +
                ", rotation_range_min: " +
                jsonObject.rotation_range_min +
                ", rotation_range_max: " +
                jsonObject.rotation_range_max +
                ", velocity: " +
                jsonObject.velocity +
                ", acceleration: " +
                jsonObject.acceleration +
                ", deceleration: " +
                jsonObject.deceleration +
                ", period: " +
                jsonObject.period;
        }

        console.log(consoleString);
    }

    setTimerPeriod(period: number | null) {
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

    setQualityFactor(factor: number | null) {
        if (!this.cameraQualityFactorTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: factor});
        this.cameraQualityFactorTopic.publish(message);
    }
}
