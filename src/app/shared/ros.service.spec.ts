import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
import {VoiceAssistant} from "./voice-assistant";
import {MotorSettingsMessage} from "./motorSettingsMessage";

describe("RosService", () => {
    let rosService: RosService;
    let spyOnSetupRos: jasmine.Spy<() => ROSLIB.Ros>;
    let spyOnVoiceAssistantTopic: jasmine.Spy<() => void>;
    let spyOnMotorCurrentTopic: jasmine.Spy<() => void>;
    let spyOnCameraTopicTopic: jasmine.Spy<() => void>;
    let spyOnTimerPeriodTopic: jasmine.Spy<() => void>;
    let spyOnPreviewSizeTopic: jasmine.Spy<() => void>;
    let spyOnQualityFactorTopic: jasmine.Spy<() => void>;
    let spyOnJointTrajectoryTopic: jasmine.Spy<() => void>;
    let spyOnInitSubscribers: jasmine.Spy<() => void>;
    let spyOnMotorSettingsTopc: jasmine.Spy<() => void>;

    let spyOnSubscribeCurrentTopic: jasmine.Spy<() => void>;
    let spyOnSubscribeMotorSettingsTopic: jasmine.Spy<() => void>;
    let spyOnSubscribePreviewSize: jasmine.Spy<() => void>;
    let spyOnSubscribeQualityFactorTopic: jasmine.Spy<() => void>;
    let spyOnSubscribeTimePeriod: jasmine.Spy<() => void>;
    let spyOnSubscribeVoiceAssistant: jasmine.Spy<() => void>;
    let spyOnSubscribeJointTrajectoryTopic: jasmine.Spy<() => void>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RosService],
        });

        rosService = TestBed.inject(RosService);
        rosService.initTopics();
        spyOnSetupRos = spyOn(rosService, "setUpRos").and.callThrough();
        spyOnInitSubscribers = spyOn(
            rosService,
            "initSubscribers",
        ).and.callThrough();

        spyOnJointTrajectoryTopic = spyOn(
            rosService,
            "createJointTrajectoryTopic",
        ).and.callThrough();
        spyOnMotorCurrentTopic = spyOn(
            rosService,
            "createMotorCurrentTopic",
        ).and.callThrough();
        spyOnCameraTopicTopic = spyOn(
            rosService,
            "createCameraTopic",
        ).and.callThrough();
        spyOnTimerPeriodTopic = spyOn(
            rosService,
            "createTimePeriodTopic",
        ).and.callThrough();
        spyOnQualityFactorTopic = spyOn(
            rosService,
            "createQualityFactorTopic",
        ).and.callThrough();
        spyOnPreviewSizeTopic = spyOn(
            rosService,
            "createPreviewSizeTopic",
        ).and.callThrough();
        spyOnVoiceAssistantTopic = spyOn(
            rosService,
            "createVoiceAssistantTopic",
        ).and.callThrough();
        spyOnMotorSettingsTopc = spyOn(
            rosService,
            "createMotorSettingsTopic",
        ).and.callThrough();
        spyOnSubscribeCurrentTopic = spyOn(
            rosService,
            "subscribeCurrentTopic",
        ).and.callThrough();
        spyOnSubscribeMotorSettingsTopic = spyOn(
            rosService,
            "subscribeMotorSettingsTopic",
        ).and.callThrough();
        spyOnSubscribePreviewSize = spyOn(
            rosService,
            "subscribePreviewSize",
        ).and.callThrough();
        spyOnSubscribeQualityFactorTopic = spyOn(
            rosService,
            "subscribeQualityFactorTopic",
        ).and.callThrough();
        spyOnSubscribeTimePeriod = spyOn(
            rosService,
            "subscribeTimePeriod",
        ).and.callThrough();
        spyOnSubscribeVoiceAssistant = spyOn(
            rosService,
            "subscribeVoiceAssistant",
        ).and.callThrough();
        spyOnSubscribeJointTrajectoryTopic = spyOn(
            rosService,
            "subscribeJointTrajectoryTopic",
        ).and.callThrough();
    });

    it("should be created", () => {
        expect(rosService).toBeTruthy();
    });

    it("should establish ros in the constructor", () => {
        rosService.setUpRos();
        expect(spyOnSetupRos).toHaveBeenCalled();
        expect(rosService.Ros).toBeTruthy();
    });

    it("should create all ROSLIB topics", () => {
        rosService.initTopics();
        expect(spyOnJointTrajectoryTopic).toHaveBeenCalled();
        expect(spyOnMotorCurrentTopic).toHaveBeenCalled();
        expect(spyOnCameraTopicTopic).toHaveBeenCalled();
        expect(spyOnTimerPeriodTopic).toHaveBeenCalled();
        expect(spyOnQualityFactorTopic).toHaveBeenCalled();
        expect(spyOnPreviewSizeTopic).toHaveBeenCalled();
        expect(spyOnVoiceAssistantTopic).toHaveBeenCalled();
        expect(spyOnMotorSettingsTopc).toHaveBeenCalled();
        expect(rosService["jointTrajectoryTopic"]).toBeTruthy();
        expect(rosService["motorCurrentTopic"]).toBeTruthy();
        expect(rosService["cameraTopic"]).toBeTruthy();
        expect(rosService["timerPeriodTopic"]).toBeTruthy();
        expect(rosService["qualityFactorTopic"]).toBeTruthy();
        expect(rosService["previewSizeTopic"]).toBeTruthy();
        expect(rosService["voiceAssistantTopic"]).toBeTruthy();
        expect(rosService["motorSettingsTopic"]).toBeTruthy();
    });

    it("should create all ROS subscribers", () => {
        rosService.initTopics();
        rosService.initSubscribers();
        expect(spyOnInitSubscribers).toHaveBeenCalled();
        expect(spyOnSubscribeCurrentTopic).toHaveBeenCalled();
        expect(spyOnSubscribeMotorSettingsTopic).toHaveBeenCalled();
        expect(spyOnSubscribePreviewSize).toHaveBeenCalled();
        expect(spyOnSubscribeQualityFactorTopic).toHaveBeenCalled();
        expect(spyOnSubscribeTimePeriod).toHaveBeenCalled();
        expect(spyOnSubscribeVoiceAssistant).toHaveBeenCalled();
        expect(spyOnSubscribeJointTrajectoryTopic).toHaveBeenCalled();
        expect(rosService["motorSettingsReceiver$"]).toBeTruthy();
        expect(rosService["qualityFactorReceiver$"]).toBeTruthy();
        expect(rosService["jointTrajectoryReceiver$"]).toBeTruthy();
        expect(rosService["voiceAssistantReceiver$"]).toBeTruthy();
        expect(rosService["cameraReceiver$"]).toBeTruthy();
        expect(rosService["timerPeriodReceiver$"]).toBeTruthy();
        expect(rosService["previewSizeReceiver$"]).toBeTruthy();
    });

    it("should publish the message on calling sendVoiceActivationMessage", () => {
        const spySendVoiceActivationMessage = spyOn(
            rosService,
            "sendVoiceActivationMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["voiceAssistantTopic"], "publish");
        const message: VoiceAssistant = {
            activationFlag: true,
            personality: "1",
            threshold: 1.3,
            gender: "male",
        };
        rosService.sendVoiceActivationMessage(message);
        expect(spySendVoiceActivationMessage).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(
            new ROSLIB.Message({data: JSON.stringify(message)}),
        );
    });

    it("should publish the JointTrajectoryMessage on calling sendJointTrajectoryMessage", () => {
        const spySendJointTrajectoryMessage = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyJointTrajectoryTopicPublish = spyOn(
            rosService["jointTrajectoryTopic"],
            "publish",
        );
        const jtMessage = createEmptyJointTrajectoryMessage();
        rosService.sendJointTrajectoryMessage(jtMessage);
        expect(spySendJointTrajectoryMessage).toHaveBeenCalled();
        expect(spyJointTrajectoryTopicPublish).toHaveBeenCalledWith(
            new ROSLIB.Message(jtMessage),
        );
    });

    it("should publish the MotorSettingsMessage on calling sendMotorSettingsMessage", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            rosService,
            "sendMotorSettingsMessage",
        ).and.callThrough();
        const spyMotorSettingsTopicPublish = spyOn(
            rosService["motorSettingsTopic"],
            "publish",
        );
        const motorSettingsMessage: MotorSettingsMessage = {
            motor_name: "test",
            turned_on: true,
            pulse_width_min: 100,
            pulse_width_max: 100,
            rotation_range_min: 100,
            rotation_range_max: 100,
            velocity: 100,
            acceleration: 100,
            deceleration: 100,
            period: 100,
        };
        rosService.sendMotorSettingsMessage(motorSettingsMessage);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalled();
        expect(spyMotorSettingsTopicPublish).toHaveBeenCalled();
    });

    it("should publish the preview size on calling setPreviewsize", () => {
        const spyOnSetPreviewSize = spyOn(
            rosService,
            "setPreviewSize",
        ).and.callThrough();
        const spyOnPreviewSizeTopicPublish = spyOn(
            rosService["previewSizeTopic"],
            "publish",
        ).and.callThrough();
        rosService.setPreviewSize(400, 400);
        expect(spyOnSetPreviewSize).toHaveBeenCalledWith(400, 400);
        expect(spyOnPreviewSizeTopicPublish).toHaveBeenCalled();
    });

    it("should publish the quality factor on calling setQualityFactor", () => {
        const spyOnSetQualityFactor = spyOn(
            rosService,
            "setQualityFactor",
        ).and.callThrough();
        const spyOnQualityFactorTopicPublish = spyOn(
            rosService["qualityFactorTopic"],
            "publish",
        ).and.callThrough();
        rosService.setQualityFactor(50);
        expect(spyOnSetQualityFactor).toHaveBeenCalledWith(50);
        expect(spyOnQualityFactorTopicPublish).toHaveBeenCalled();
    });

    it("should publish the timer period on calling setTimerPeriod", () => {
        const spyOnSetTimerPeriod = spyOn(
            rosService,
            "setTimerPeriod",
        ).and.callThrough();
        const spyOnTimerPeriodTopicPublish = spyOn(
            rosService["timerPeriodTopic"],
            "publish",
        ).and.callThrough();
        rosService.setTimerPeriod(0.5);
        expect(spyOnSetTimerPeriod).toHaveBeenCalledWith(0.5);
        expect(spyOnTimerPeriodTopicPublish).toHaveBeenCalled();
    });
});
