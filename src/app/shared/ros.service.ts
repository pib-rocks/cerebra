import {Injectable, isDevMode} from "@angular/core";
import * as ROSLIB from "roslib";
import {BehaviorSubject, Subject} from "rxjs";
import {Message} from "./message";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {Motor} from "./motor";
import {VoiceAssistant} from "./voice-assistant";
import {MotorCurrentMessage} from "./currentMessage";
import {jointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
@Injectable({
    providedIn: "root",
})
export class RosService {
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
    jointTrajectoryReceiver$: Subject<jointTrajectoryMessage> =
        new Subject<jointTrajectoryMessage>();
    private ros!: ROSLIB.Ros;
    private sliderMessageTopic!: ROSLIB.Topic;
    private motorSettingsTopic!: ROSLIB.Topic;
    private voiceAssistantTopic!: ROSLIB.Topic;
    private motorCurrentConsumptionTopic!: ROSLIB.Topic;
    private cameraTopic!: ROSLIB.Topic;
    private timerPeriodTopic!: ROSLIB.Topic;
    private previewSizeTopic!: ROSLIB.Topic;
    private qualityFactorTopic!: ROSLIB.Topic;
    private jointTrajectoryTopic!: ROSLIB.Topic;

    sharedAllFingersMotorPositionSource = new Subject<jointTrajectoryMessage>();
    sharedMotorPosition$ =
        this.sharedAllFingersMotorPositionSource.asObservable();

    sharedAllFingersMotorSettingsSource = new Subject<MotorSettingsMessage>();
    sharedMotorSettings$ =
        this.sharedAllFingersMotorSettingsSource.asObservable();

    private readonly topicName = "/motor_settings";
    private readonly topicMotorSettingsName = "/motorSettings";
    private readonly topicVoiceName = "/cerebra_voice_settings";
    private readonly topicCurrentName = "/motor_status";
    private readonly topicCameratName = "/camera_topic";
    private readonly topicJointTrajectoryName = "/joint_trajectory";

    private motors: Motor[] = [];

    constructor() {
        this.ros = this.setUpRos();
        this.ros.on("connection", () => {
            console.log("Connected to ROS");
            this.isInitializedSubject.next(true);
            this.sliderMessageTopic = this.createMessageTopic();
            this.motorSettingsTopic = this.createMotorSettingsTopic();
            this.voiceAssistantTopic = this.createVoiceAssistantTopic();
            this.motorCurrentConsumptionTopic =
                this.createMotorCurrentConsumptionTopic();
            this.cameraTopic = this.createCameraTopic();
            this.previewSizeTopic = this.createPreviewSizeTopic();
            this.timerPeriodTopic = this.createTimePeriodTopic();
            this.qualityFactorTopic = this.createQualityFactorPublisher();
            this.jointTrajectoryTopic = this.createJointTrajectoryTopic();
            this.subscribeSliderTopic();
            this.subscribeMotorSettingsTopic();
            this.subscribeCurrentConsumptionTopic();
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
            messageType: "std_msgs/String",
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

    registerMotor(
        motorName: string,
        motorSettingsReceiver$: Subject<MotorSettingsMessage>,
        jtMotorReceiver$: Subject<jointTrajectoryMessage>,
    ) {
        let isRegistered = false;
        if (this.ros.isConnected) {
            this.motors.forEach((m) => {
                if (m.motor === motorName) {
                    m.motorSettingsReceiver$ = motorSettingsReceiver$;
                    m.jointTrajectoryReceiver$ = jtMotorReceiver$;
                    isRegistered = true;
                }
            });

            if (!isRegistered) {
                const motor: Motor = {
                    motor: motorName,
                    motorSettingsReceiver$: motorSettingsReceiver$,
                    jointTrajectoryReceiver$: jtMotorReceiver$,
                };
                this.motors.push(motor);
            }
        }
    }

    public printMotors() {
        console.log("MotorsLength: " + this.motors.length);
        this.motors.forEach((m) => {
            console.log("MotorsForEach: " + m.motor);
        });
    }

    updateSharedMotorPosition(jtMessage: jointTrajectoryMessage) {
        this.sharedAllFingersMotorPositionSource.next(jtMessage);
    }

    updateSharedMotorSettingsValue(motorSettingsMessage: MotorSettingsMessage) {
        this.sharedAllFingersMotorSettingsSource.next(motorSettingsMessage);
    }

    sendSliderMessage(msg: Message | VoiceAssistant | MotorCurrentMessage) {
        const json = JSON.parse(JSON.stringify(msg));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const message = new ROSLIB.Message({data: JSON.stringify(parameters)});

        if ("motor" in msg) {
            if ("currentValue" in msg) {
                this.motorCurrentConsumptionTopic?.publish(message);
                console.log("Sent message " + JSON.stringify(message));
            } else {
                this.sliderMessageTopic?.publish(message);
                console.log("Sent message " + JSON.stringify(message));
            }
        } else {
            this.voiceAssistantTopic.publish(message);
        }
    }

    sendMotorSettingsMessage(motorSettingsMessage: MotorSettingsMessage) {
        const json = JSON.parse(JSON.stringify(motorSettingsMessage));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const message = new ROSLIB.Message({data: JSON.stringify(parameters)});

        this.motorSettingsTopic.publish(message);
        this.sendMotorSettingsConsoleLog("Sent", message);
    }

    sendJointTrajectoryMessage(jointTrajectoryMessage: jointTrajectoryMessage) {
        const message = new ROSLIB.Message(jointTrajectoryMessage);

        this.jointTrajectoryTopic.publish(message);
        this.sendJointTrajectoryConsoleLog("Sent", message);
    }

    sendJointTrajectoryConsoleLog(
        sentReceivedPrefix: string,
        jtMessage: ROSLIB.Message,
    ) {
        const jsonJtString = JSON.stringify(jtMessage);
        const parsedJtJson = JSON.parse(jsonJtString) as jointTrajectoryMessage;

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

        console.log(
            sentReceivedPrefix +
                " settings message for motor: " +
                jsonObject.motor,
        );
    }

    sendVoiceActivationMessage(msg: VoiceAssistant) {
        const message = new ROSLIB.Message({data: JSON.stringify(msg)});
        this.voiceAssistantTopic.publish(message);
        console.log("Sent message " + JSON.stringify(message));
    }

    getReceiversByMotorName(motorName: string): Subject<Message>[] {
        const foundMotors = this.motors.filter((m) => m.motor === motorName);
        return foundMotors.length > 0
            ? foundMotors.map((m) => m["motorSettingsReceiver$"])
            : [];
    }

    getJtReceiversByMotorName(
        motorName: string,
    ): Subject<jointTrajectoryMessage>[] {
        const foundMotors = this.motors.filter((m) => m.motor === motorName);
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

    subscribeJointTrajectoryTopic() {
        this.jointTrajectoryTopic.subscribe((jointTrajectoryMessage) => {
            const jsonString = JSON.stringify(jointTrajectoryMessage);
            const parsedJtJson = JSON.parse(
                jsonString,
            ) as jointTrajectoryMessage;

            const receivers$ = this.getJtReceiversByMotorName(
                parsedJtJson.joint_names[0],
            );
            receivers$.forEach((r) => {
                r.next(parsedJtJson);
            });

            this.sendJointTrajectoryConsoleLog(
                "Received",
                jointTrajectoryMessage,
            );
        });
    }

    subscribeMotorSettingsTopic() {
        this.motorSettingsTopic.subscribe((message) => {
            const jsonStr = JSON.stringify(message);
            const json = JSON.parse(jsonStr);
            const jsonArray = JSON.parse(json["data"]);
            const jsonObject = jsonArray.reduce(
                (key: object, value: object) => {
                    return {...key, ...value};
                },
                {},
            );

            this.sendMotorSettingsConsoleLog("Received", message);

            const receivers$ = this.getMotorSettingsReceiversByMotorName(
                jsonObject["motor"],
            );
            receivers$.forEach((r) => {
                r.next(jsonObject);
            });
        });
    }

    subscribeSliderTopic() {
        this.sliderMessageTopic.subscribe((message) => {
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
            const receivers$ = this.getReceiversByMotorName(
                jsonObject["motor"],
            );
            receivers$.forEach((r) => {
                r.next(jsonObject);
            });
        });
    }

    subscribeCurrentConsumptionTopic() {
        this.motorCurrentConsumptionTopic.subscribe((message) => {
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

    get Topic(): ROSLIB.Topic {
        return this.sliderMessageTopic;
    }

    createMessageTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicName,
            messageType: "std_msgs/String",
        });
    }

    createVoiceAssistantTopic(): ROSLIB.Topic {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: this.topicVoiceName,
            messageType: "std_msgs/String",
        });
    }

    createMotorCurrentConsumptionTopic(): ROSLIB.Topic {
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

    createQualityFactorPublisher() {
        return new ROSLIB.Topic({
            ros: this.ros,
            name: "quality_factor_topic",
            messageType: "std_msgs/Int32",
        });
    }
}
