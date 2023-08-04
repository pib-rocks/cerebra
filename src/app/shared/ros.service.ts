import { Injectable, isDevMode } from "@angular/core";
import * as ROSLIB from "roslib";
import { BehaviorSubject, Subject } from "rxjs";
import { Message } from "./message";
import { Motor } from "./motor";
import { VoiceAssistant } from "./voice-assistant";
import { MotorCurrentMessage } from "./currentMessage";

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
  qualityFactorReceiver$: BehaviorSubject<number> = new BehaviorSubject<number>(
    80,
  );
  voiceAssistantReceiver$: Subject<any> = new Subject<any>();
  private ros!: ROSLIB.Ros;
  private sliderMessageTopic!: ROSLIB.Topic;
  private voiceAssistantTopic!: ROSLIB.Topic;
  private motorCurrentConsumptionTopic!: ROSLIB.Topic;
  private cameraTopic!: ROSLIB.Topic;
  private timerPeriodTopic!: ROSLIB.Topic;
  private previewSizeTopic!: ROSLIB.Topic;
  private qualityFactorTopic!: ROSLIB.Topic;
  sharedAllFingersValueSource = new Subject<Message>();
  sharedValue$ = this.sharedAllFingersValueSource.asObservable();

  private readonly topicName = "/motor_settings";
  private readonly topicVoiceName = "/cerebra_voice_settings";
  private readonly topicCurrentName = "/motor_status";
  private readonly topicCameratName = "/camera_topic";
  private motors: Motor[] = [];

  constructor() {
    this.ros = this.setUpRos();
    this.ros.on("connection", () => {
      console.log("Connected to ROS");
      this.isInitializedSubject.next(true);
      this.sliderMessageTopic = this.createMessageTopic();
      this.voiceAssistantTopic = this.createVoiceAssistantTopic();
      this.motorCurrentConsumptionTopic =
        this.createMotorCurrentConsumptionTopic();
      this.cameraTopic = this.createCameraTopic();
      this.previewSizeTopic = this.createPreviewSizeTopic();
      this.timerPeriodTopic = this.createTimePeriodTopic();
      this.qualityFactorTopic = this.createQualityFactorPublisher();
      this.subscribeSliderTopic();
      this.subscribeCurrentConsumptionTopic();
      this.subscribePreviewSize();
      this.subscribeQualityFactorTopic();
      this.subscribeTimePeriod();
      this.subscribeVoiceAssistant();
    });
    this.ros.on("error", (error: string) => {
      console.log("Error connecting to ROSBridge server:", error);
    });

    this.ros.on("close", () => {
      console.log("Disconnected from ROSBridge server.");
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

  registerMotor(motorName: string, motorReceiver$: Subject<Message>) {
    let isRegistered = false;
    if (this.ros.isConnected) {
      this.motors.forEach((m) => {
        if (m.motor === motorName) {
          m.receiver$ = motorReceiver$;
          isRegistered = true;
        }
      });

      if (!isRegistered) {
        const motor: Motor = {
          motor: motorName,
          receiver$: motorReceiver$,
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

  updateSharedValue(value: Message) {
    this.sharedAllFingersValueSource.next(value);
  }

  sendSliderMessage(msg: Message | VoiceAssistant | MotorCurrentMessage) {
    const json = JSON.parse(JSON.stringify(msg));
    const parameters = Object.keys(json).map((key) => ({ [key]: json[key] }));
    const message = new ROSLIB.Message({ data: JSON.stringify(parameters) });
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
      console.log("Sent message " + JSON.stringify(message));
    }
  }

  getReceiversByMotorName(motorName: string): Subject<Message>[] {
    const foundMotors = this.motors.filter((m) => m.motor === motorName);
    return foundMotors.length > 0 ? foundMotors.map((m) => m["receiver$"]) : [];
  }

  setUpRos() {
    let rosUrl: string;
    if (isDevMode()) {
      rosUrl = "192.168.220.110";
    } else {
      rosUrl = window.location.hostname;
    }
    return new ROSLIB.Ros({
      url: `ws://${rosUrl}:9090`,
    });
  }

  subscribeSliderTopic() {
    this.sliderMessageTopic.subscribe((message) => {
      const jsonStr = JSON.stringify(message);
      const json = JSON.parse(jsonStr);
      const jsonArray = JSON.parse(json["data"]);
      const jsonObject = jsonArray.reduce((key: object, value: object) => {
        return { ...key, ...value };
      }, {});
      console.log(
        "Received message for " +
          jsonObject["motor"] +
          ": " +
          JSON.stringify(jsonObject),
      );
      const receivers$ = this.getReceiversByMotorName(jsonObject["motor"]);
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
      const jsonObject = jsonArray.reduce((key: object, value: object) => {
        return { ...key, ...value };
      }, {});
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
    const message = new ROSLIB.Message({ data: period });
    this.timerPeriodTopic.publish(message);
  }

  setPreviewSize(width: number, height: number) {
    if (!this.previewSizeTopic) {
      console.error("ROS is not connected.");
      return;
    }

    const message = new ROSLIB.Message({ data: [width, height] });
    this.previewSizeTopic.publish(message);
  }

  setQualityFactor(factor: number | null) {
    if (!this.qualityFactorTopic) {
      console.error("ROS is not connected.");
      return;
    }

    const message = new ROSLIB.Message({ data: factor });
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
