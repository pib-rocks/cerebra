import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {BehaviorSubject, Subject} from "rxjs";
import {Message} from "./message";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {Motor} from "./motor";
import {VoiceAssistant} from "./voice-assistant";
import {MotorCurrentMessage} from "./currentMessage";
import {JointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {
    JointTrajectoryPoint,
    createDefaultRosTime,
} from "./rosMessageTypes/jointTrajectoryPoint";
import {
    StdMessageHeader,
    createDefaultStdMessageHeader,
} from "./rosMessageTypes/stdMessageHeader";
@Injectable({
    providedIn: "root",
})
export class RosService {
    //to be removed in PR-319
    private isInitializedSubject = new BehaviorSubject<boolean>(false);
    isInitialized$ = this.isInitializedSubject.asObservable();
    currentReceiver$: Subject<MotorCurrentMessage> =
        new Subject<MotorCurrentMessage>();
    timerPeriodReceiver$: BehaviorSubject<number> = new BehaviorSubject<number>(
        0.1,
    );
    cameraReceiver$: Subject<string> = new Subject<string>();
    previewSizeReceiver$: BehaviorSubject<number[]> = new BehaviorSubject<
        number[]
    >([640, 480]);
    qualityFactorReceiver$: BehaviorSubject<number> =
        new BehaviorSubject<number>(80);
    voiceAssistantReceiver$: Subject<any> = new Subject<any>();
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage> =
        new Subject<JointTrajectoryMessage>();
    motorSettingsReceiver$: Subject<MotorSettingsMessage> =
        new Subject<MotorSettingsMessage>();
    private ros!: ROSLIB.Ros;
    private motorSettingsTopic!: ROSLIB.Topic;
    private voiceAssistantTopic!: ROSLIB.Topic;
    private motorCurrentTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private timerPeriodTopic!: ROSLIB.Topic;
    private previewSizeTopic!: ROSLIB.Topic;
    private qualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;
    //to be removed in PR-319

    private readonly topicMotorSettingsName = "/motor_settings";
    private readonly topicVoiceName = "/cerebra_voice_settings";
    private readonly topicCurrentName = "/motor_status";
    private readonly topicCameratName = "/camera_topic";
    private readonly topicJointTrajectoryName = "/joint_trajectory";

    private motors: Motor[] = [];

    //PR-287
    public motorValueSubject = new Subject<Message>();

    constructor() {
        this.ros = this.setUpRos();
        this.ros.on("connection", () => {
            console.log("Connected to ROS");
            this.isInitializedSubject.next(true);
            this.motorSettingsTopic = this.createMotorSettingsTopic();
            this.voiceAssistantTopic = this.createVoiceAssistantTopic();
            this.motorCurrentTopic = this.createMotorCurrentTopic();
            this.cameraTopic = this.createCameraTopic();
            this.previewSizeTopic = this.createPreviewSizeTopic();
            this.timerPeriodTopic = this.createTimePeriodTopic();
            this.qualityFactorTopic = this.createQualityFactorTopic();
            this.jointTrajectoryTopic = this.createJointTrajectoryTopic();
            this.subscribeMotorSettingsTopic();
            this.subscribeCurrentTopic();
            this.subscribePreviewSize();
            this.subscribeQualityFactorTopic();
            this.subscribeTimePeriod();
            this.subscribeVoiceAssistant();
            this.subscribeJointTrajectoryTopic();
        });
        this.ros.on("error", (error: string) => {
            console.log("Error connecting to ROSBridge server:", error);
        });

        this.ros.on("close", () => {
            console.log("Disconnected from ROSBridge server.");
        });
    }

    createJointTrajectoryTopic() {
        return new ROSLIB.Topic({
            ros: this.Ros,
            name: this.topicJointTrajectoryName,
            messageType: "trajectory_msgs/msg/JointTrajectory",
        });
    }

    createMotorSettingsTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicMotorSettingsName,
            messageType: "datatypes/msg/MotorSettings",
        });
    }

    createTimePeriodTopic(): ROSLIB.Topic<ROSLIB.Message> {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: "timer_period_topic",
            messageType: "std_msgs/Float64",
        });
    }
    createPreviewSizeTopic(): ROSLIB.Topic<ROSLIB.Message> {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: "size_topic",
            messageType: "std_msgs/Int32MultiArray",
        });
    }

    sendMotorSettingsMessage(motorSettingsMessage: MotorSettingsMessage) {
        this.motorSettingsTopic.publish(motorSettingsMessage);
        console.log("sent " + JSON.stringify(motorSettingsMessage));
        // this.sendMotorSettingsConsoleLog("Sent: ", motorSettingsMessage);
    }

    sendJointTrajectoryMessage(jointTrajectoryMessage: JointTrajectoryMessage) {
        const message = new ROSLIB.Message(jointTrajectoryMessage);
        this.jointTrajectoryTopic.publish(message);
        this.sendJointTrajectoryConsoleLog("Sent", message);
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

    sendVoiceActivationMessage(msg: VoiceAssistant) {
        const message = new ROSLIB.Message({data: JSON.stringify(msg)});
        this.voiceAssistantTopic.publish(message);
    }

    getJtReceiversByMotorName(
        motorNames: string[],
    ): Subject<JointTrajectoryMessage>[] {
        const foundMotors = this.motors.filter((m) =>
            motorNames.includes(m.motor),
        );
        return foundMotors.length > 0
            ? foundMotors.map((m) => m["jointTrajectoryReceiver$"])
            : [];
    }

    getMotorSettingsReceiversByMotorName(
        motorName: string,
    ): Subject<MotorSettingsMessage>[] {
        const foundMotors = this.motors.filter((m) => m.motor === motorName);
        return foundMotors.length > 0
            ? foundMotors.map((m) => m["motorSettingsReceiver$"])
            : [];
    }

    setUpRos() {
        let rosUrl: string;
        if (isDevMode()) {
            rosUrl = "192.168.220.109";
        } else {
            rosUrl = window.location.hostname;
        }
        return new ROSLIB.Ros({
            url: `ws://${rosUrl}:9090`,
        });
    }

    subscribeMotorSettingsTopic() {
        this.motorSettingsTopic.subscribe((message) => {
            console.log(message);
            this.motorSettingsReceiver$.next(message as MotorSettingsMessage);
        });
    }

    subscribeJointTrajectoryTopic() {
        this.jointTrajectoryTopic.subscribe((jointTrajectoryMessage) => {
            this.jointTrajectoryReceiver$.next(
                jointTrajectoryMessage as JointTrajectoryMessage,
            );
        });
    }

    subscribeCurrentTopic() {
        this.motorCurrentTopic.subscribe((message) => {
            const jsonStr = JSON.stringify(message);
            const json = JSON.parse(jsonStr);
            const jsonArray = JSON.parse(json["data"]);
            const jsonObject = jsonArray.reduce(
                (key: object, value: object) => {
                    return {...key, ...value};
                },
                {},
            );
            console.log(
                "Received message for " +
                    jsonObject["motor"] +
                    ": " +
                    JSON.stringify(jsonObject),
            );
            this.currentReceiver$.next(jsonObject);
        });
    }

    subscribeCameraTopic() {
        this.cameraTopic.subscribe((message: any) => {
            this.cameraReceiver$.next(message.data);
        });
    }

    subscribeQualityFactorTopic() {
        this.qualityFactorTopic.subscribe((message: any) => {
            this.qualityFactorReceiver$.next(message.data);
        });
    }

    subscribePreviewSize() {
        this.previewSizeTopic.subscribe((message: any) => {
            this.previewSizeReceiver$.next(message.data);
        });
    }

    subscribeTimePeriod() {
        this.timerPeriodTopic.subscribe((message: any) => {
            this.timerPeriodReceiver$.next(message.data);
        });
    }

    subscribeVoiceAssistant() {
        this.voiceAssistantTopic.subscribe((message: any) => {
            this.voiceAssistantReceiver$.next(message.data);
        });
    }

    unsubscribeCameraTopic() {
        this.cameraTopic.unsubscribe();
    }

    get Ros(): ROSLIB.Ros {
        return this.ros;
    }

    createVoiceAssistantTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicVoiceName,
            messageType: "std_msgs/String",
        });
    }

    createMotorCurrentTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicCurrentName,
            messageType: "std_msgs/String",
        });
    }

    createCameraTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicCameratName,
            messageType: "std_msgs/String",
        });
    }
    setTimerPeriod(period: number | null) {
        if (!this.timerPeriodTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: period});
        this.timerPeriodTopic.publish(message);
    }

    setPreviewSize(width: number, height: number) {
        if (!this.previewSizeTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: [width, height]});
        this.previewSizeTopic.publish(message);
    }

    setQualityFactor(factor: number | null) {
        if (!this.qualityFactorTopic) {
            console.error("ROS is not connected.");
            return;
        }
        const message = new ROSLIB.Message({data: factor});
        this.qualityFactorTopic.publish(message);
    }

    createQualityFactorTopic() {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: "quality_factor_topic",
            messageType: "std_msgs/Int32",
        });
    }

    createEmptyJointTrajectoryMessage(): JointTrajectoryMessage {
        const jointTrajectoryMessage: JointTrajectoryMessage = {
            header: createDefaultStdMessageHeader(),
            joint_names: <string[]>[],
            points: <JointTrajectoryPoint[]>[],
        };

        return jointTrajectoryMessage;
    }

    createJointTrajectoryPoint(position: number): JointTrajectoryPoint {
        const jointTrajectoryPoint: JointTrajectoryPoint = {
            positions: new Array<number>(),
            time_from_start: createDefaultRosTime(),
        };
        jointTrajectoryPoint.positions.push(position);
        return jointTrajectoryPoint;
    }
}
