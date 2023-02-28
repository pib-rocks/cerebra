import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  isInitialized$ = this.isInitializedSubject.asObservable();

  public ros: ROSLIB.Ros;

  public topics: ROSLIB.Topic[] = [];

  constructor() {
    this.ros = this.setUpRos();
    this.ros.on('connection', () => {
      console.log('Connected to ROS');
      this.isInitializedSubject.next(true);
    });

    this.ros.on('error', (error: string) => {
      console.log('Error connecting to ROSBridge server:', error);
    });

    this.ros.on('close', () => {
      console.log('Disconnected from ROSBridge server.');
    });
  }

  subscribeTopic(topicName: string, receiver$: Subject<number>) {
    if (this.ros.isConnected) {
      const topic = this.createTopic(topicName);
      this.topics.push(topic);
      topic.subscribe((message) => {
        const jsonStr = JSON.stringify(message);
        console.log('Get message from ' + topicName + ': ' + jsonStr);
        const json = JSON.parse(jsonStr);
        const value = Number(json["data"]);
        receiver$.next(value);
      })
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
      : this.createTopic(topicName);
  }

  setUpRos(){
    return new ROSLIB.Ros({
      url: 'ws://192.168.220.38:9090',
    });
  }
}
