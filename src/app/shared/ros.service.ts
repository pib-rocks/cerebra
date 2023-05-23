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
  cameraReceiver$: Subject<string> = new Subject<string>;
  private ros!: ROSLIB.Ros;
  private messageTopic!: ROSLIB.Topic;
  private voiceAssistantTopic!: ROSLIB.Topic;
  private motorCurrentTopic!: ROSLIB.Topic;
  private cameraTopic!: ROSLIB.Topic;
  private timerPeriodPublisher!: ROSLIB.Topic;
  private previewSizePublisher!: ROSLIB.Topic;
  private qualityFactorPublisher!: ROSLIB.Topic;

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
      this.messageTopic = this.createMessageTopic();
      this.voiceAssistantTopic = this.createVoiceAssistantTopic();
      this.motorCurrentTopic = this.createMotorCurrentTopic();
      this.cameraTopic = this.createCameraTopic();
      this.previewSizePublisher = this.createPreviewSizePublisher()
      this.timerPeriodPublisher = this.createTimePeriodPublisher();
      this.qualityFactorPublisher = this.createQualityFactorPublisher();
      this.subscribeTopic();
      this.subscribeCurrentTopic();
    });
    this.ros.on("error", (error: string) => {
      console.log("Error connecting to ROSBridge server:", error);
    });

    this.ros.on("close", () => {
      console.log("Disconnected from ROSBridge server.");
    });
  }
  createTimePeriodPublisher(): ROSLIB.Topic<ROSLIB.Message> {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: 'timer_period_topic',
      messageType: 'std_msgs/Float64'
    });
  }
  createPreviewSizePublisher(): ROSLIB.Topic<ROSLIB.Message> {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: 'size_topic',
      messageType: 'std_msgs/Int32MultiArray'
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

  sendMessage(msg: Message | VoiceAssistant | MotorCurrentMessage) {
    const json = JSON.parse(JSON.stringify(msg));
    const parameters = Object.keys(json).map((key) => ({ [key]: json[key] }));
    const message = new ROSLIB.Message({ data: JSON.stringify(parameters) });
    if ("motor" in msg) {
      if ("currentValue" in msg) {
        this.motorCurrentTopic?.publish(message);
        console.log("Sent message " + JSON.stringify(message));
      } else {
        this.messageTopic?.publish(message);
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

  subscribeTopic() {
    this.messageTopic.subscribe((message) => {
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
          JSON.stringify(jsonObject)
      );
      const receivers$ = this.getReceiversByMotorName(jsonObject["motor"]);
      receivers$.forEach((r) => {
        r.next(jsonObject);
      });
    });
  }

  subscribeCurrentTopic() {
    this.motorCurrentTopic.subscribe((message) => {
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
          JSON.stringify(jsonObject)
      );
      this.currentReceiver$.next(jsonObject);
    });
  }

  subscribeCameraTopic() {
    this.cameraTopic.subscribe((message: any) => {
      this.cameraReceiver$.next(message.data);
    });
  }

  unsubscribeCameraTopic() {
    this.cameraTopic.unsubscribe();
}

  get Ros(): ROSLIB.Ros {
    return this.ros;
  }

  get Topic(): ROSLIB.Topic {
    return this.messageTopic;
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

  createMotorCurrentTopic(): ROSLIB.Topic {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: this.topicCurrentName,
      messageType: "std_msgs/String",
    });
  }

  createCameraTopic(): ROSLIB.Topic {
    return new ROSLIB.Topic({
      ros : this.ros,
      name : this.topicCameratName,
      messageType : 'std_msgs/String'
    });
  }
  setTimerPeriod(period: number | null) {
    if (!this.timerPeriodPublisher) {
      console.error('ROS is not connected.');
      return;
    }
    const message = new ROSLIB.Message({ data: period });
    this.timerPeriodPublisher.publish(message);
  }

  setPreviewSize(width: number, height: number) {
    if (!this.previewSizePublisher) {
      console.error('ROS is not connected.');
      return;
    }

    const message = new ROSLIB.Message({ data: [width, height] });
    this.previewSizePublisher.publish(message);
  }

  setQualityFactor(factor: number | null){
    if (!this.qualityFactorPublisher) {
        console.error('ROS is not connected.');
        return;
    }

    const message = new ROSLIB.Message({ data: factor });
    this.qualityFactorPublisher.publish(message);
}

  createQualityFactorPublisher() {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: 'quality_factor_topic',
      messageType: 'std_msgs/Int32'
    });
  }
  
}
