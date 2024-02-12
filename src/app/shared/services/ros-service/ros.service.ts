import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {BehaviorSubject, Subject, ReplaySubject, Observable} from "rxjs";
import {MotorSettingsMessage} from "../../ros-message-types/motorSettingsMessage";
import {DiagnosticStatus} from "../../ros-message-types/DiagnosticStatus.message";
import {JointTrajectoryMessage} from "../../ros-message-types/jointTrajectoryMessage";
import {rosDataTypes} from "../../ros-message-types/rosDataTypePaths.enum";
import {rosTopics} from "./rosTopics.enum";
import {
    SetVoiceAssistantStateRequest,
    SetVoiceAssistantStateResponse,
} from "../../ros-message-types/SetVoiceAssistantState";
import {ChatMessage} from "../../ros-message-types/ChatMessage";
import {VoiceAssistantState} from "../../ros-message-types/VoiceAssistantState";
import {GetVoiceAssistantStateResponse} from "../../ros-message-types/GetVoiceAssistantState";
import {rosServices} from "./rosServices.enum";
import {MotorSettingsError} from "../../error/motor-settings-error";
import {
    MotorSettingsServiceRequest,
    MotorSettingsServiceResponse,
} from "../../ros-message-types/motorSettingsService";

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
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState> =
        new BehaviorSubject<VoiceAssistantState>({
            turned_on: false,
            chat_id: "",
        });

    private ros!: ROSLIB.Ros;

    private motorCurrentTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private cameraTimerPeriodTopic!: ROSLIB.Topic;
    private cameraPreviewSizeTopic!: ROSLIB.Topic;
    private cameraQualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;
    private motorSettingsTopic!: ROSLIB.Topic;
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
            rosUrl = "192.168.1.90";
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

        this.motorSettingsService = this.createRosService(
            rosServices.motorSettingsServiceName,
            rosDataTypes.motorSettingsSrv,
        );
        this.setVoiceAssistantStateService = this.createRosService(
            rosServices.setVoiceAssistantState,
            rosDataTypes.setVoiceAssistantState,
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
