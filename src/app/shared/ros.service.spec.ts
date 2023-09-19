import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {Subject} from "rxjs";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {RosService} from "./ros.service";
import {JointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";

describe("RosService", () => {
    let rosService: RosService;
    let mockRos: RosMock;
    let mockTopic: MockRosbridgeTopic;
    let mockJtTopic: MockRosbridgeJtTopic;
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

        rosService = TestBed.inject(RosService);
        mockRos = new RosMock(rosService);
        mockRos.setConnection(true);
        const receiver$ = new Subject<MotorSettingsMessage>();
        const jtMessageReceiver$ = new Subject<JointTrajectoryMessage>();
        mockTopic = new MockRosbridgeTopic(receiver$);
        mockJtTopic = new MockRosbridgeJtTopic(jtMessageReceiver$);

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
        ).and.returnValue(mockJtTopic as unknown as ROSLIB.Topic);

        spyVoiceTopic = spyOn(
            RosService.prototype,
            "createVoiceAssistantTopic",
        ).and.returnValue(mockTopic as unknown as ROSLIB.Topic);

        spyMotorCurrentTopic = spyOn(
            RosService.prototype,
            "createMotorCurrentTopic",
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
            "subscribeMotorSettingsTopic",
        ).and.callThrough();
        rosService = new RosService();

        spySubscribeCurrentTopic = spyOn(
            RosService.prototype,
            "subscribeCurrentTopic",
        ).and.callThrough();
    });

    it("should be created", () => {
        expect(rosService).toBeTruthy();
    });

    it("should establish ros in the constructor", () => {
        expect(spySetUpRos).toHaveBeenCalled();
        expect(rosService.Ros).toBeTruthy();
    });

    xit("should subscribe motor topic", () => {
        mockRos.on();
        expect(spySubscribeTopic).toHaveBeenCalled();
    });

    it("createTopic should create topic", () => {
        expect(spytopic).toHaveBeenCalled();
    });

    it("createJointTrajectoryTopic should create the jointTrajectory topic", () => {
        expect(spyJointTrajectoryTopic).toHaveBeenCalled();
    });

    it("createVoiceTopic should create voice topic", () => {
        expect(spyVoiceTopic).toHaveBeenCalled();
    });

    it("createPreviewSizePublisher should create preview size topic", () => {
        expect(spySize).toHaveBeenCalled();
    });

    it("createMotorCurrentTopic should create motor current topic", () => {
        expect(spyMotorCurrentTopic).toHaveBeenCalled();
    });

    it("createCameraTopic should create camera topic", () => {
        expect(spyCameraTopic).toHaveBeenCalled();
    });

    it("The messageTopic should publish the message to rosbridge when calling sendMessage method, Incase the Message is of type Message", () => {
        rosService = new RosService();
        (rosService as any).sliderMessageTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            rosService,
            "sendSliderMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["sliderMessageTopic"], "publish");
        const message = {motor: "test", value: "10"};
        const json = JSON.parse(JSON.stringify(message));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const msg = new ROSLIB.Message({data: JSON.stringify(parameters)});
        rosService.sendSliderMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The motorCurrentTopic should publish the message to rosbridge when calling sendSliderMessage method, Incase the Message is of type MotorCurrentMessage ", () => {
        rosService = new RosService();
        (rosService as any).motorCurrentTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            rosService,
            "sendSliderMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["motorCurrentTopic"], "publish");
        const message = {motor: "test", currentValue: 10};
        const json = JSON.parse(JSON.stringify(message));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const msg = new ROSLIB.Message({data: JSON.stringify(parameters)});
        rosService.sendSliderMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The voiceAssistantTopic should publish the message when the sendVoiceActivationMessage method is called.", () => {
        rosService = new RosService();
        (rosService as any).voiceAssistantTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            rosService,
            "sendVoiceActivationMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["voiceAssistantTopic"], "publish");
        const message = {
            activationFlag: true,
            personality: "1",
            threshold: 1.3,
            gender: "male",
        };
        const msg = new ROSLIB.Message({data: JSON.stringify(message)});
        rosService.sendVoiceActivationMessage(message);
        expect(spySendMassege).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(msg);
    });

    it("The jointTrajectoryTopic should publish the message to rosbridge when calling sendJointTrajectoryMessage method", () => {
        rosService = new RosService();
        (rosService as any).jointTrajectoryTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "/joint_trajectory",
            messageType: "trajectory_msgs/msg/JointTrajectory",
        });
        const spySendMessage = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["jointTrajectoryTopic"], "publish");
        const jtMessage = rosService.createEmptyJointTrajectoryMessage();
        rosService.sendJointTrajectoryMessage(jtMessage);
        expect(spySendMessage).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(new ROSLIB.Message(jtMessage));
    });

    it("subscribeJointTrajectoryTopic should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (rosService as any).jointTrajectoryTopic = new MockRosbridgeJtTopic(
            jointTrajectoryMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        const spyNext = spyOn(motor.jointTrajectoryMessageReceiver$, "next");
        (rosService as any).motors.push();
        rosService.subscribeJointTrajectoryTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("subscribeMotorSettingsTopic should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (rosService as any).motorSettingsTopic = new MockRosbridgeTopic(
            motorSettingsMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        (rosService as any).motors.push();
        const spyNext = spyOn(motor.motorSettingsMessageReceiver$, "next");
        rosService.subscribeMotorSettingsTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("subscribeMotorSettingsTopic tbd should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (rosService as any).motorSettingsTopic = new MockRosbridgeTopic(
            motorSettingsMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        (rosService as any).motors.push();
        const spyNext = spyOn(motor.motorSettingsMessageReceiver$, "next");
        rosService.subscribeMotorSettingsTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("should be able to get a single motor receiver by name", () => {
        const expectedReceiver = new Subject<MotorSettingsMessage>();
        const expectedJTReceiver = new Subject<JointTrajectoryMessage>();
        const motor = {
            motor: "test",
            motorSettingsReceiver$: expectedReceiver,
            jointTrajectoryReceiver$: expectedJTReceiver,
        };
        (rosService as any).motors.push(motor);
        const actualReceiver$ =
            rosService.getMotorSettingsReceiversByMotorName("test")[0];
        expect(expectedReceiver).toEqual(actualReceiver$);
    });
});

class MockRosbridgeJtTopic {
    rosService = new RosService();
    constructor(private subject: Subject<JointTrajectoryMessage>) {}
    subscribers: ((message: any) => void)[] = [];
    messages: any[] = [];
    subscribe(callback: (message: any) => void) {
        this.subscribers.push(callback);
        this.subject.next(this.rosService.createEmptyJointTrajectoryMessage());
    }
    publish(message: any) {
        this.messages.push(message);
        for (const callback of this.subscribers) {
            callback(message);
        }
    }
}

class MockRosbridgeTopic {
    constructor(private subject: Subject<MotorSettingsMessage>) {}
    subscribers: ((message: any) => void)[] = [];
    messages: any[] = [];
    subscribe(callback: (message: any) => void) {
        this.subscribers.push(callback);
        this.subject.next({motorName: "test"});
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
        this.service?.createJointTrajectoryTopic();
        this.service?.createMotorCurrentTopic();
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
