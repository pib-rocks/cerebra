import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
import {VoiceAssistant} from "./voice-assistant";
import {MotorSettingsMessage} from "./rosMessageTypes/motorSettingsMessage";
import {MotorSettingsSrvResponse} from "./rosMessageTypes/motorSettingsSrvResponse";
import {MotorSettingsError} from "./error/motor-settings-error";

describe("RosService", () => {
    let rosService: RosService;
    let spyOnSetupRos: jasmine.Spy<() => ROSLIB.Ros>;

    let motorSettingsMessage: MotorSettingsMessage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RosService],
        });

        rosService = TestBed.inject(RosService);
        rosService.initTopicsAndServices();
        spyOnSetupRos = spyOn(rosService, "setUpRos").and.callThrough();

        motorSettingsMessage = {
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

    it("should call the service with the MotorSettingsMessage on calling sendMotorSettingsMessageCallback", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            rosService,
            "sendMotorSettingsMessageCallback",
        ).and.callThrough();
        const spyMotorSettingsServiceCall = spyOn(
            rosService["motorSettingsService"],
            "callService",
        );
        rosService.sendMotorSettingsMessageCallback(motorSettingsMessage);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalled();
        expect(spyMotorSettingsServiceCall).toHaveBeenCalled();
    });

    it("should resolve the promise when calling sendMotorSettings and the motorSettingsService calls the callback-function with success-message", async () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                const res: MotorSettingsSrvResponse = {successful: true};
                callback(res);
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        await expectAsync(
            rosService.sendMotorSettingsMessage(motorSettingsMessage),
        ).toBeResolvedTo(motorSettingsMessage);
        expect(spyOnMotorSettingsReceiver).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
    });

    it("should reject the promise when calling sendMotorSettings and the motorSettingsService calls the callback-function with failure-message", async () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                const res: MotorSettingsSrvResponse = {successful: false};
                callback(res);
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        await expectAsync(
            rosService.sendMotorSettingsMessage(motorSettingsMessage),
        ).toBeRejectedWithError(
            MotorSettingsError,
            `Failed to apply settings from message: ${JSON.stringify(
                motorSettingsMessage,
                null,
                2,
            )}.`,
        );
        expect(spyOnMotorSettingsReceiver).not.toHaveBeenCalled();
    });

    it("should reject the promise when calling sendMotorSettings and the motorSettingsService calls the failure-callback-function", async () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                const res: MotorSettingsSrvResponse = {successful: false};
                failedCallback?.("test-error-message");
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        await expectAsync(
            rosService.sendMotorSettingsMessage(motorSettingsMessage),
        ).toBeRejectedWithError(Error, "test-error-message");
        expect(spyOnMotorSettingsReceiver).not.toHaveBeenCalled();
    });

    it("should call the success-callback when calling sendMotorSettings and the motorSettingsService calls the callback-function with success-message", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                const res: MotorSettingsSrvResponse = {successful: true};
                callback(res);
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        const successCallbackSpy = jasmine.createSpy("success", (msg) => {});
        const failureCallbackSpy = jasmine.createSpy("failure", (err) => {});

        rosService.sendMotorSettingsMessageCallback(
            motorSettingsMessage,
            failureCallbackSpy,
            successCallbackSpy,
        );

        expect(successCallbackSpy).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
        expect(failureCallbackSpy).not.toHaveBeenCalled();
        expect(spyOnMotorSettingsReceiver).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
    });

    it("should call the failure-callback when calling sendMotorSettings and the motorSettingsService calls the callback-function with failure-message", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                const res: MotorSettingsSrvResponse = {successful: false};
                callback(res);
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        let wrapper = {failureArg: new Error("not the expected error")};
        const successCallbackSpy = jasmine.createSpy("success", (msg) => {});
        const failureCallbackSpy = jasmine
            .createSpy("failure", (err) => (wrapper.failureArg = err))
            .and.callThrough();

        rosService.sendMotorSettingsMessageCallback(
            motorSettingsMessage,
            failureCallbackSpy,
            successCallbackSpy,
        );

        expect(successCallbackSpy).not.toHaveBeenCalled();
        expect(failureCallbackSpy).toHaveBeenCalledOnceWith(wrapper.failureArg);
        expect(wrapper.failureArg).toBeInstanceOf(MotorSettingsError);
        expect(wrapper.failureArg.message).toBe(
            `Failed to apply settings from message: ${JSON.stringify(
                motorSettingsMessage,
                null,
                2,
            )}.`,
        );
        expect(spyOnMotorSettingsReceiver).not.toHaveBeenCalled();
    });

    it("should call the faiure-callback when calling sendMotorSettings and the motorSettingsService calls its failure-callback-function with", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (msg, callback, failedCallback) => {
                failedCallback?.("expected-error-message");
            },
        );

        const spyOnMotorSettingsReceiver = spyOn(
            rosService.motorSettingsReceiver$,
            "next",
        );

        let wrapper = {failureArg: new Error("non-expected-error-message")};
        const successCallbackSpy = jasmine.createSpy("success", (msg) => {});
        const failureCallbackSpy = jasmine
            .createSpy("failure", (err) => (wrapper.failureArg = err))
            .and.callThrough();

        rosService.sendMotorSettingsMessageCallback(
            motorSettingsMessage,
            failureCallbackSpy,
            successCallbackSpy,
        );

        expect(successCallbackSpy).not.toHaveBeenCalled();
        expect(failureCallbackSpy).toHaveBeenCalledOnceWith(wrapper.failureArg);
        expect(wrapper.failureArg).not.toBeInstanceOf(MotorSettingsError);
        expect(wrapper.failureArg).toBeInstanceOf(Error);
        expect(wrapper.failureArg.message).toBe("expected-error-message");
        expect(spyOnMotorSettingsReceiver).not.toHaveBeenCalled();
    });

    it("should call the service with the MotorSettingsMessage on calling sendMotorSettingsMessage", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            rosService,
            "sendMotorSettingsMessage",
        ).and.callThrough();
        const spyMotorSettingsSeviceCall = spyOn(
            rosService["motorSettingsService"],
            "callService",
        );
        rosService.sendMotorSettingsMessage(motorSettingsMessage);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalled();
        expect(spyMotorSettingsSeviceCall).toHaveBeenCalled();
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
