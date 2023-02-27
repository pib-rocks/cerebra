import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  isInitialized$ = this.isInitializedSubject.asObservable();

  private ros: ROSLIB.Ros;

  private topics: ROSLIB.Topic[] = [];

  constructor() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.220.38:9090',
    });

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

  subscribeTopic(topicName: string, receiver$: Subject<number>) {
    if (this.ros.isConnected) {
      const topic = this.createTopic(topicName);

      topic.subscribe((message) => {
        const jsonStr = JSON.stringify(message);
        console.log('Get message from ' + topicName + ': ' + jsonStr);
        const json = JSON.parse(jsonStr);
        const value = Number(json["data"]);
        receiver$.next(value);
      })

      this.topics.push(topic);
    }
  }

  public createTopic(topicName: string) {
    return new ROSLIB.Topic({
      ros: this.ros,
      name: topicName,
      messageType: 'std_msgs/String'
    });
  }

  sendMessage(topicName: string, value: number) {
    const message = new ROSLIB.Message({
      data: String(value)
    });
    console.log('Send message to ' + topicName + ': ' + JSON.stringify(message));
    this.getTopicByName(topicName).publish(message);
  }

  getTopicByName(topicName: string): ROSLIB.Topic {
    const filteredTopics = this.topics.filter(topic => topic.name === topicName);

    return filteredTopics.length > 0
      ? filteredTopics[0]
      : new ROSLIB.Topic({
        ros: this.ros,
        name: topicName,
        messageType: 'std_msgs/String'
      });
  }

  retrieveLastValue(topicName: string): number {
    //To-Do
    return 0;
  }

  isSubscribed(topicName: string): boolean {
    const filteredTopics = this.topics.filter(t => t.name === topicName);
    return filteredTopics.length > 0
  }

  get Ros() {
    return this.ros;
  }
}
