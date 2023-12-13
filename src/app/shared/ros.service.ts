import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {BehaviorSubject, ReplaySubject, Observable, Subject} from "rxjs";
import {MotorSettingsMessage} from "./rosMessageTypes/motorSettingsMessage";
import {VoiceAssistantMsg} from "./voice-assistant";
import {DiagnosticStatus} from "./rosMessageTypes/DiagnosticStatus.message";
import {JointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {rosDataTypes} from "./rosMessageTypes/rosDataTypePaths.enum";
import {rosTopics} from "./rosTopics.enum";
import {rosServices} from "./rosServices.enum";
import {MotorSettingsError} from "./error/motor-settings-error";
import {MotorSettingsSrvResponse} from "./rosMessageTypes/motorSettingsSrvResponse";

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
    voiceAssistantReceiver$: Subject<any> = new Subject<any>();
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage> =
        new Subject<JointTrajectoryMessage>();
    motorSettingsReceiver$: Subject<MotorSettingsMessage> =
        new Subject<MotorSettingsMessage>();
    private ros!: ROSLIB.Ros;
    private voiceAssistantTopic!: ROSLIB.Topic;
    private motorCurrentTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private cameraTimerPeriodTopic!: ROSLIB.Topic;
    private cameraPreviewSizeTopic!: ROSLIB.Topic;
    private cameraQualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;
    private motorSettingsService!: ROSLIB.Service;

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
            rosUrl = "192.168.220.181";
        } else {
            rosUrl = window.location.hostname;
        }
        return new ROSLIB.Ros({
            url: `ws://${"192.168.220.68"}:9090`,
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
        this.voiceAssistantTopic = this.createRosTopic(
            rosTopics.voiceTopicName,
            rosDataTypes.string,
        );
        this.motorSettingsService = this.createRosService(
            rosServices.motorSettingsServiceName,
            rosDataTypes.motorSettingsSrv,
        );
    }

    createRosService(serviceName: string, serviceType: string): ROSLIB.Service {
        return new ROSLIB.Service({
            ros: this.ros,
            name: serviceName,
            serviceType: serviceType,
        });
    }

    createRosTopic(topicName: string, topicMessageType: string): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: topicName,
            messageType: topicMessageType,
        });
    }

    initSubscribers() {
        this.subscribeDefaultRosMessageTopic(
            this.voiceAssistantTopic,
            this.voiceAssistantReceiver$,
        );
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

    subscribeMotorCurrentTopic() {
        this.motorCurrentTopic.subscribe((message) => {
            this.currentReceiver$.next(message as DiagnosticStatus);
        });
    }

    unsubscribeCameraTopic() {
        this.cameraTopic.unsubscribe();
    }

    sendMotorSettingsMessage(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        const subject: Subject<MotorSettingsMessage> = new ReplaySubject();
        this.motorSettingsService.callService(
            motorSettingsMessage,
            (response) => {
                if (response["settings_applied"]) {
                    this.motorSettingsReceiver$.next(motorSettingsMessage);
                    if (response["settings_persisted"]) {
                        subject.next(motorSettingsMessage);
                    } else {
                        subject.error(
                            new MotorSettingsError(motorSettingsMessage, true),
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

    sendVoiceActivationMessage(msg: VoiceAssistantMsg) {
        const message = new ROSLIB.Message({data: JSON.stringify(msg)});
        this.voiceAssistantTopic.publish(message);
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
