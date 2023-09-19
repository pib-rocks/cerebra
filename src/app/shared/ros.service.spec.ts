import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {Subject} from "rxjs";
import {MotorSettingsMessage} from "./motorSettingsMessage";
import {RosService} from "./ros.service";
import {
    createEmptyJointTrajectoryMessage,
    JointTrajectoryMessage,
} from "./rosMessageTypes/jointTrajectoryMessage";

describe("RosService", () => {
    let service: RosService;
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

        service = TestBed.inject(RosService);
        mockRos = new RosMock(service);
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
        service = new RosService();

        spySubscribeCurrentTopic = spyOn(
            RosService.prototype,
            "subscribeCurrentTopic",
        ).and.callThrough();
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

    it("The motorCurrentTopic should publish the message to rosbridge when calling sendSliderMessage method, Incase the Message is of type MotorCurrentMessage ", () => {
        service = new RosService();
        (service as any).motorCurrentTopic = new ROSLIB.Topic({
            ros: mockRos as unknown as ROSLIB.Ros,
            name: "test",
            messageType: "std_msgs/String",
        });
        const spySendMassege = spyOn(
            service,
            "sendSliderMessage",
        ).and.callThrough();
        const spyPublish = spyOn(service["motorCurrentTopic"], "publish");
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
        const spySendMessage = spyOn(
            service,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyPublish = spyOn(service["jointTrajectoryTopic"], "publish");
        const jtMessage = createEmptyJointTrajectoryMessage();
        service.sendJointTrajectoryMessage(jtMessage);
        expect(spySendMessage).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(new ROSLIB.Message(jtMessage));
    });

    it("subscribeJointTrajectoryTopic should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (service as any).jointTrajectoryTopic = new MockRosbridgeJtTopic(
            jointTrajectoryMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        const spyNext = spyOn(motor.jointTrajectoryMessageReceiver$, "next");
        (service as any).motors.push();
        service.subscribeJointTrajectoryTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("subscribeMotorSettingsTopic should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (service as any).motorSettingsTopic = new MockRosbridgeTopic(
            motorSettingsMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        (service as any).motors.push();
        const spyNext = spyOn(motor.motorSettingsMessageReceiver$, "next");
        service.subscribeMotorSettingsTopic();
        expect(spyNext).toHaveBeenCalled();
    });

    it("subscribeMotorSettingsTopic tbd should publish a value to a rxjs subject", (): void => {
        const jointTrajectoryMessageReceiver$ =
            new Subject<JointTrajectoryMessage>();
        const motorSettingsMessageReceiver$ =
            new Subject<MotorSettingsMessage>();
        (service as any).motorSettingsTopic = new MockRosbridgeTopic(
            motorSettingsMessageReceiver$,
        ) as unknown as ROSLIB.Topic;
        const motor = {
            motor: "test",
            motorSettingsMessageReceiver$,
            jointTrajectoryMessageReceiver$,
        };
        (service as any).motors.push();
        const spyNext = spyOn(motor.motorSettingsMessageReceiver$, "next");
        service.subscribeMotorSettingsTopic();
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
        (service as any).motors.push(motor);
        const actualReceiver$ = service.getReceiversByMotorName("test")[0];
        expect(expectedReceiver).toEqual(actualReceiver$);
    });
});

class MockRosbridgeJtTopic {
    constructor(private subject: Subject<JointTrajectoryMessage>) {}
    subscribers: ((message: any) => void)[] = [];
    messages: any[] = [];
    subscribe(callback: (message: any) => void) {
        this.subscribers.push(callback);
        this.subject.next(createEmptyJointTrajectoryMessage());
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
