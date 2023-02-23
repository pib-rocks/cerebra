import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as ROSLIB from 'roslib';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  isInitialized$ = this.isInitializedSubject.asObservable();

  private static rosService: RosService = new RosService();

  private ros: ROSLIB.Ros;

  private topics: ROSLIB.Topic[] = [];

  private constructor() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.220.38:9090',
    });

    console.log('Connecting to ros');
    this.ros.on('connection', () => {
      console.log('Connected to ROS');
      this.isInitializedSubject.next(true);
    });

    this.ros.on('error', (error: any) => {
      console.log('Error connecting to ROSBridge server:', error);
    });

    this.ros.on('close', () => {
      console.log('Disconnected from ROSBridge server.');
    });
  }

  subscribe(topicName: string, formControl: FormControl) {
    if (this.ros.isConnected) {
      const topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/' + topicName,
        messageType: 'std_msgs/String'
      });

      topic.subscribe((message) => {
        const jsonStr = JSON.stringify(message);
        console.log('Get message from /' + topicName + ': ' + jsonStr);
        const json = JSON.parse(jsonStr);
        const value = Number(json["data"]);
        formControl.setValue(value);
      })

      this.topics.push(topic);
    }
  }

  sendMessage(topicName: string, value: number) {
    console.log('Send message to /' + topicName + ': data: ' + value);
    const message = new ROSLIB.Message({
      data: String(value)
    });
    this.getTopicByName(topicName).publish(message);
  }

  getTopicByName(topicName: string): ROSLIB.Topic {
    const filteredTopics = this.topics.filter(topic => topic.name === topicName);

    return filteredTopics.length > 0
      ? filteredTopics[0]
      : new ROSLIB.Topic({
        ros: this.ros!,
        name: '/' + topicName,
        messageType: 'std_msgs/String'
      });
  }

  retrieveLastValue(topicName: string): number {
    //To-Do
    return 0;
  }

  isSubscribed(topicName: string): boolean {
    const filteredTopics = this.topics.filter(t => t.name === "/" + topicName);
    return filteredTopics.length > 0
  }

  static get Instance() {
    return RosService.rosService;
  }
}
