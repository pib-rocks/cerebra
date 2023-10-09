import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
import {VoiceAssistant} from "./voice-assistant";

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
    let spyOnInitTopic: jasmine.Spy<() => void>;
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
        spyOnInitTopic = spyOn(rosService, "initTopics").and.callThrough();
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

    it("should publish the message onto the voiceAssistantTopic when the sendVoiceActivationMessage-function is called.", () => {
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

    it("should publish the message onto the jointTrajectoryTopic when calling the sendJointTrajectoryMessage method", () => {
        const spySendMessage = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["jointTrajectoryTopic"], "publish");
        const jtMessage = createEmptyJointTrajectoryMessage();
        rosService.sendJointTrajectoryMessage(jtMessage);
        expect(spySendMessage).toHaveBeenCalled();
        expect(spyPublish).toHaveBeenCalledWith(new ROSLIB.Message(jtMessage));
    });
});
