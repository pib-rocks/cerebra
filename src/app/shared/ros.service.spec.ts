import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {Subject} from "rxjs";
import {Message} from "./message";
import {RosService} from "./ros.service";
import {createDefaultJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";

describe("RosService", () => {
    let service: RosService;
    let mockRos: RosMock;
    let mockTopic: MockRosbridgeTopic;
    let spySetUpRos: jasmine.Spy<() => ROSLIB.Ros>;
    let spytopic: jasmine.Spy<() => ROSLIB.Topic>;
    let spyVoiceTopic: jasmine.Spy<() => ROSLIB.Topic>;
    let spyMotorCurrentTopic: jasmine.Spy<() => ROSLIB.Topic>;
    let spyJointTrajectoryTopic: jasmine.Spy<() => ROSLIB.Topic>;
    let spyCameraTopic: jasmine.Spy<() => ROSLIB.Topic>;
    let spySize: jasmine.Spy<() => ROSLIB.Topic>;
    let spySubscribeTopic: jasmine.Spy<() => void>;
    let spySubscribeCurrentTopic: jasmine.Spy<() => void>;
    beforeEach(() => {
        TestBed.configureTestingModule({});

        service = TestBed.inject(RosService);
        mockRos = new RosMock(service);
        mockRos.setConnection(true);
        const receiver$ = new Subject<Message>();
        mockTopic = new MockRosbridgeTopic("test", receiver$);

        spySetUpRos = spyOn(RosService.prototype, "setUpRos").and.returnValue(
            mockRos as unknown as ROSLIB.Ros,
        );
        spytopic = spyOn(
            RosService.prototype,
            "createMessageTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spyJointTrajectoryTopic = spyOn(
            RosService.prototype,
            "createJointTrajectoryTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spyVoiceTopic = spyOn(
            RosService.prototype,
            "createVoiceAssistantTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spyMotorCurrentTopic = spyOn(
            RosService.prototype,
            "createMotorCurrentConsumptionTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spyCameraTopic = spyOn(
            RosService.prototype,
            "createCameraTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spySize = spyOn(
            RosService.prototype,
            "createPreviewSizeTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spySubscribeTopic = spyOn(
            RosService.prototype,
            "subscribeSliderTopic",
        ).and.callThrough();
        service = new RosService();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should establish ros in the constructor", () => {
        expect(spySetUpRos).toHaveBeenCalled();
        expect(service.Ros).toBeTruthy();
    });

    xit("should subscribe motor topic", () => {
        mockRos.on();
        expect(spySubscribeTopic).toHaveBeenCalled();
    });

    it("createTopic should create topic", () => {
        expect(spytopic).toHaveBeenCalled();
    });

    it("createVoiceTopic should create voice topic", () => {
        expect(spyVoiceTopic).toHaveBeenCalled();
    });

    it("createPreviewSizePublisher should create preview size topic", () => {
        expect(spySize).toHaveBeenCalled();
    });

    it("createTopic should create motor current topic", () => {
        expect(spyMotorCurrentTopic).toHaveBeenCalled();
    });

    it("createCameraTopic should create camera topic", () => {
        expect(spyCameraTopic).toHaveBeenCalled();
    });

    it("The messageTopic should publish the message to rosbridge when calling sendMessage method, Incase the Message is of type Message", () => {
        service = new RosService();
        (service as any).sliderMessageTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            service,
            "sendSliderMessage",
        ).and.callThrough();
        const spyPublish = spyOn(service["sliderMessageTopic"], "publish");
        const message = {motor: "test", value: "10"};
        const json = JSON.parse(JSON.stringify(message));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const msg = new ROSLIB.Message({data: JSON.stringify(parameters)});
        service.sendSliderMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The motorCurrentTopic should publish the message to rosbridge when calling sendMessage method, Incase the Message is of type MotorCurrentMessage ", () => {
        service = new RosService();
        (service as any).motorCurrentConsumptionTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            service,
            "sendSliderMessage",
        ).and.callThrough();
        const spyPublish = spyOn(
            service["motorCurrentConsumptionTopic"],
            "publish",
        );
        const message = {motor: "test", currentValue: 10};
        const json = JSON.parse(JSON.stringify(message));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const msg = new ROSLIB.Message({data: JSON.stringify(parameters)});
        service.sendSliderMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The voiceAssistantTopic should publish the message when the sendVoiceActivationMessage method is called.", () => {
        service = new RosService();
        (service as any).voiceAssistantTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            service,
            "sendVoiceActivationMessage",
        ).and.callThrough();
        const spyPublish = spyOn(service["voiceAssistantTopic"], "publish");
        const message = {
            activationFlag: true,
            personality: "1",
            threshold: 1.3,
            gender: "male",
        };
        const msg = new ROSLIB.Message({data: JSON.stringify(message)});
        service.sendVoiceActivationMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The jointTrajectoryTopic should publish the message to rosbridge when calling sendJointTrajectoryMessage method", () => {
        service = new RosService();
        (service as any).jointTrajectoryTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "/joint_trajectory",
            messageType: "trajectory_msgs/msg/JointTrajectory",
        });
        const spySendMassege = spyOn(
            service,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyPublish = spyOn(service["jointTrajectoryTopic"], "publish");
        const jtMessage = createDefaultJointTrajectoryMessage();
        service.sendJointTrajectoryMessage(jtMessage);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(new ROSLIB.Message(jtMessage));
    });

    it("subscribeTopic should emmit a value to a subject", (): void => {
        const receiver$ = new Subject<Message>();
        (service as any).sliderMessageTopic = new MockRosbridgeTopic(
            "test",
            receiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {motor: "test", receiver$: receiver$};
        (service as any).motors.push();
        const spyNext = spyOn(motor.receiver$, "next");
        service.subscribeSliderTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("should be able to get a single motor receiver by name", () => {
        const expectedReceiver = new Subject<Message>();
        const motor = {motor: "test", receiver$: expectedReceiver};
        (service as any).motors.push(motor);
        const actualReceiver2$ = service.getReceiversByMotorName("test")[0];
        expect(expectedReceiver).toEqual(actualReceiver2$);
    });
});

class MockRosbridgeTopic {
    constructor(
        private topicName: string,
        private subject: Subject<Message>,
    ) {}
    subscribers: ((message: any) => void)[] = [];
    messages: any[] = [];
    subscribe(callback: (message: any) => void) {
        this.subscribers.push(callback);
        this.subject.next({motor: "test", value: "10"});
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

    constructor(service: RosService) {
        this.service = service;
    }

    private connected: boolean = false;

    setConnection(b: boolean) {
        this.connected = b;
    }

    on() {
        this.service?.createMessageTopic();
        this.service?.createVoiceAssistantTopic();
        this.service?.createMotorCurrentConsumptionTopic();
        this.service?.createCameraTopic();
        this.service?.createPreviewSizeTopic();
    }

    callOnConnection() {
        // Mock connection callback
        this.connected = true;
    }

    isConnected() {
        return this.connected;
    }
    close() {
        // Mock close method
        this.connected = false;
    }
}
