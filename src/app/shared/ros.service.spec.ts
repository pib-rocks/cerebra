import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
import {VoiceAssistantMsg} from "./voice-assistant";
import {MotorSettingsMessage} from "./rosMessageTypes/motorSettingsMessage";
import {MotorSettingsSrvResponse} from "./rosMessageTypes/motorSettingsSrvResponse";
import {Observable} from "rxjs";

describe("RosService", () => {
    let rosService: RosService;
    let spyOnSetupRos: jasmine.Spy<() => ROSLIB.Ros>;

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
        active: true,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RosService],
        });

        rosService = TestBed.inject(RosService);
        rosService.initTopicsAndServices();
        spyOnSetupRos = spyOn(rosService, "setUpRos").and.callThrough();
    });

    it("should be created", () => {
        expect(rosService).toBeTruthy();
    });

    it("should establish ros in the constructor", () => {
        rosService.setUpRos();
        expect(spyOnSetupRos).toHaveBeenCalled();
        expect(rosService.Ros).toBeTruthy();
    });

    it("should create all ROSLIB topics and services", () => {
        expect(rosService["jointTrajectoryTopic"]).toBeTruthy();
        expect(rosService["motorCurrentTopic"]).toBeTruthy();
        expect(rosService["cameraTopic"]).toBeTruthy();
        expect(rosService["cameraTimerPeriodTopic"]).toBeTruthy();
        expect(rosService["cameraQualityFactorTopic"]).toBeTruthy();
        expect(rosService["cameraPreviewSizeTopic"]).toBeTruthy();
        expect(rosService["voiceAssistantTopic"]).toBeTruthy();
        expect(rosService["motorSettingsService"]).toBeTruthy();
    });

    it("should publish the message on calling sendVoiceActivationMessage", () => {
        const spySendVoiceActivationMessage = spyOn(
            rosService,
            "sendVoiceActivationMessage",
        ).and.callThrough();
        const spyPublish = spyOn(rosService["voiceAssistantTopic"], "publish");
        const message: VoiceAssistantMsg = {
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

    it("should call the service with the MotorSettingsMessage on calling sendMotorSettingsMessage", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            rosService,
            "sendMotorSettingsMessage",
        ).and.callThrough();
        const spyMotorSettingsServiceCall = spyOn(
            rosService["motorSettingsService"],
            "callService",
        );
        rosService.sendMotorSettingsMessage(motorSettingsMessage);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalled();
        expect(spyMotorSettingsServiceCall).toHaveBeenCalled();
    });

    it("should handle the case correctly, where, after calling sendMotorSettingsMessage(), the motorSettingsService calls the success-callback with a message that indicates, that both application as well as persistence were successul", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (_msg, callback, _failedCallback) => {
                const res: MotorSettingsSrvResponse = {
                    settings_applied: true,
                    settings_persisted: true,
                };
                callback(res);
            },
        );
        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        const obs: Observable<MotorSettingsMessage> =
            rosService.sendMotorSettingsMessage(motorSettingsMessage);
        const subscribeCallBackSpy = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        obs.subscribe(subscribeCallBackSpy);

        expect(subscribeCallBackSpy.next).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
        rosService.sendMotorSettingsMessage(motorSettingsMessage);
    });

    it("should publish the preview size on calling setPreviewsize", () => {
        const spyOnSetPreviewSize = spyOn(
            rosService,
            "setPreviewSize",
        ).and.callThrough();
        const spyOnPreviewSizeTopicPublish = spyOn(
            rosService["cameraPreviewSizeTopic"],
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
            rosService["cameraQualityFactorTopic"],
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
            rosService["cameraTimerPeriodTopic"],
            "publish",
        ).and.callThrough();
        rosService.setTimerPeriod(0.5);
        expect(spyOnSetTimerPeriod).toHaveBeenCalledWith(0.5);
        expect(spyOnTimerPeriodTopicPublish).toHaveBeenCalled();
    });
});
