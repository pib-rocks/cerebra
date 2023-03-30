import { TestBed } from '@angular/core/testing';
import * as ROSLIB from 'roslib';
import { Subject } from 'rxjs';
import { Message } from './message';

import { RosService } from './ros.service';

describe('RosService', () => {
  let service: RosService;
  let mockRos: RosMock;
  let mockTopic: MockRosbridgeTopic;
  let spySetUp: jasmine.Spy<() => ROSLIB.Ros>;
  let spytopic: jasmine.Spy<() => ROSLIB.Topic>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RosService);
    mockRos = new RosMock(service)
    mockRos.setConnection(true);
    const receiver$ = new Subject<Message>();
    mockTopic = new MockRosbridgeTopic('test', receiver$);
    spySetUp = spyOn(RosService.prototype, 'setUpRos').and.returnValue(mockRos as unknown as ROSLIB.Ros);
    spytopic = spyOn(RosService.prototype, 'createTopic').and.returnValue(mockTopic as unknown as ROSLIB.Topic);
    service = new RosService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should istablish ros in the constructor', () => {
    expect(spySetUp).toHaveBeenCalled();
    expect(service.Ros).toBeTruthy()
  });

  it('createTopic should create topic', () => {
    expect(spytopic).toHaveBeenCalled();
   });

   it('createTopic should create topic', () => {
    expect(spytopic).toHaveBeenCalled();
   });

   it('sendMessage should send a massege to rosbridge without errors', () => {
    service = new RosService();
    (service as any).topic = new ROSLIB.Topic({ros: mockRos as unknown as ROSLIB.Ros,name: 'test', messageType: 'std_msgs/String'});
     const spySendMassege = spyOn(service, 'sendMessage').and.callThrough();
     const spyPublish = spyOn(service.Topic,'publish');
     const message = {motor: 'test', value: '10'}
     service.sendMessage(message);
     expect(spySendMassege).toHaveBeenCalled();
     expect(spyPublish).toHaveBeenCalled();
   });

   it('subscribeTopic should emmit a value to a subject',(): void => {
    const receiver$ = new Subject<Message>();
    (service as any).topic = new MockRosbridgeTopic('test', receiver$) as unknown as ROSLIB.Topic;
    const motor = {motor: 'test', receiver$: receiver$ };
    (service as any).motors.push()
    const spyNext = spyOn(motor.receiver$,'next');
    service.subscribeTopic();
    expect(spyNext).toHaveBeenCalled();
  });

  it('should be able to get a single motor receiver by name', () => {
    const expectedReceiver = new Subject<Message>();
    const motor = {motor: 'test', receiver$: expectedReceiver };
    (service as any).motors.push(motor);
    const actualReceiver2$ = service.getReceiversByMotorName('test')[0];
    expect(expectedReceiver).toEqual(actualReceiver2$);
  })
});

class MockRosbridgeTopic {
  constructor(private topicName: string, private subject: Subject<Message>) {}
  subscribers: ((message: any) => void)[] = [];
  messages: any[] = [];
  subscribe(callback: (message: any) => void) {
    this.subscribers.push(callback);
    this.subject.next({motor: 'test', value: '10'});
  }
  publish(message: any) {
    this.messages.push(message);
    for (const callback of this.subscribers) {
      callback(message);
    }
  }
}

export class RosMock {

  service!: RosService;
  constructor(service: RosService){
    this.service = service;
  }
  private connected: boolean = false;

  setConnection(b: boolean){
    this.connected = b;
  }

  on () {
    this.service.createTopic()
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
