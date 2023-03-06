import { TestBed } from '@angular/core/testing';
import * as ROSLIB from 'roslib';
import { Subject } from 'rxjs';

import { RosService } from './ros.service';

xdescribe('RosService', () => {
  let service: RosService;
  let mockRos: RosMock;
  let spySetUp: jasmine.Spy<() => ROSLIB.Ros>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RosService);
    mockRos = new RosMock()
    mockRos.setConnection(true);
    spySetUp = spyOn(RosService.prototype, 'setUpRos').and.returnValue(mockRos as unknown as ROSLIB.Ros);
    service = new RosService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should istablish ros in the constructor', () => {

    service = new RosService();
    expect(spySetUp).toHaveBeenCalled();
    expect(service.ros).toBeTruthy()
  });

  it('createTopic should create topic', () => {
     const topic = service.createTopic('test')
     expect(topic).toBeTruthy();
   });

   it('sendMessage should send a massege to rosbridge without errors', () => {
     const spySendMassege = spyOn(service, 'sendMessage');
     service.sendMessage('test',10)
     expect(spySendMassege).toHaveBeenCalled();
   });

   it('subscribeTopic should call createTopic and emmit a value to a subject',(): void => {
     const receiver$ = new Subject<number>();
     const spyTopic = spyOn(service,'createTopic').and.returnValue(new MockRosbridgeTopic('test', receiver$) as unknown as ROSLIB.Topic);
     const spyNext = spyOn(receiver$,'next');
     service.subscribeTopic('test',receiver$);
     expect(spyTopic).toHaveBeenCalled();
     expect(spyNext).toHaveBeenCalled();
     expect(service.topics.length).not.toBe(0);
   });

   it('should return a saved topic when calling getTopicByName',(): void => {
    const receiver$ = new Subject<number>();
    spyOn(service,'createTopic').and.returnValue(new MockRosbridgeTopic('test', receiver$) as unknown as ROSLIB.Topic);
    service.subscribeTopic('test',receiver$);
    const topic = service.getTopicByName('test');
    expect(topic).toEqual(service.topics[0]);
  });
});

class MockRosbridgeTopic {
  constructor(private topicName: string, private subject: Subject<number>) {}

  subscribers: ((message: any) => void)[] = [];
  messages: any[] = [];

  subscribe(callback: (message: any) => void) {
    this.subscribers.push(callback);
    this.subject.next(5);
  }

  publish(message: any) {
    this.messages.push(message);
    for (const callback of this.subscribers) {
      callback(message);
    }
  }
}

export class RosMock {

  private connected: boolean = false;

  setConnection(b: boolean){
    this.connected = b;
  }

  on () {
    // Mock event listeners
  }

  callOnConnection () {
    // Mock connection callback
    this.connected = true;
  }

  isConnected()  {
    return this.connected;
  }
  close ()  {
    // Mock close method
    this.connected = false;
  }
}
