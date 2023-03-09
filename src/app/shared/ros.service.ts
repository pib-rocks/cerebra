import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';
import { BehaviorSubject, Subject } from 'rxjs';
import { Message } from './message';
import { Motor } from './motor';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  isInitialized$ = this.isInitializedSubject.asObservable();

  private ros!: ROSLIB.Ros;
  private topic!: ROSLIB.Topic;
  private readonly topicName = '/motor_settings';
  private motors: Motor[] = [];

  constructor() {
    this.ros = this.setUpRos();
    this.ros.on('connection', () => {
      console.log('Connected to ROS');
      this.isInitializedSubject.next(true);
      this.topic = this.createTopic();
      this.subscribeTopic()
    });
    this.ros.on('error', (error: string) => {
      console.log('Error connecting to ROSBridge server:', error);
    });

    this.ros.on('close', () => {
      console.log('Disconnected from ROSBridge server.');
    });
  }

  registerMotor(motorName: string, motorReceiver$: Subject<Message>) {
    let isRegistered = false;
    if (this.ros.isConnected) {
      this.motors.forEach(m => {
        if (m.motor === motorName) {
          m.receiver$ = motorReceiver$;
          isRegistered = true;
        }
      });

      if (!isRegistered) {
        const motor: Motor = {
          motor: motorName,
          receiver$: motorReceiver$
        }
        this.motors.push(motor);
      }
    }
  }

  sendMessage(msg: Message) {
    const json = JSON.parse(JSON.stringify(msg));
    const parameters = Object.keys(json).map(key => ({[key]: json[key]}));
    const message = new ROSLIB.Message(
      {data: JSON.stringify(parameters)}
    );
    this.topic?.publish(message);
    console.log('Sent message' + JSON.stringify(message));
  }

  getReceiversByMotorName(motorName: string): Subject<Message>[] {
    const foundMotors = this.motors.filter(m => m.motor === motorName);
    return foundMotors.length > 0
      ? foundMotors.map(m => m['receiver$'])
      : [];
  }

  setUpRos(){
    return new ROSLIB.Ros({
      url: 'ws://192.168.220.38:9090',
    });
  }

  subscribeTopic(){
    this.topic.subscribe((message) => {
      const jsonStr = JSON.stringify(message);
      const json = JSON.parse(jsonStr);
      const jsonArray = JSON.parse(json['data']);
      const jsonObject = jsonArray.reduce((key: object, value: object) => {
        return {...key, ...value};
      }, {});
      console.log('Received message for ' + jsonObject['motor'] + ': ' + JSON.stringify(jsonObject));
      const receivers$ = this.getReceiversByMotorName(jsonObject['motor']);
      receivers$.forEach(r => {
        r.next(jsonObject);
      });
    })
  }

  get Ros(): ROSLIB.Ros{
    return this.ros;
  }

  get Topic(): ROSLIB.Topic{
    return this.topic;
  }

  createTopic(): ROSLIB.Topic {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: this.topicName,
      messageType: 'std_msgs/String'
    });
  }

}


