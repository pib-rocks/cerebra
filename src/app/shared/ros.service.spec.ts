import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "./rosMessageTypes/jointTrajectoryMessage";
import {VoiceAssistant} from "./voice-assistant";
import {MotorSettingsMessage} from "./rosMessageTypes/motorSettingsMessage";
import {MotorSettingsSrvResponse} from "./rosMessageTypes/motorSettingsSrvResponse";
import {Observable} from "rxjs";

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

    it("should return an observable that publishes the original message, if the ros-service returns a 'successful'-message after sending motor-settings-message", () => {
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
        expect(subscribeCallBackSpy.error).not.toHaveBeenCalled();
        expect(spyOnMotorSettingsReceiver).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
    });

    it("should return an observable that publishes an error, if the ros-service returns a 'unsuccessful'-message after sending motor-settings-message", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (_msg, callback, _failedCallback) => {
                const res: MotorSettingsSrvResponse = {
                    settings_applied: true,
                    settings_persisted: false,
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

        expect(subscribeCallBackSpy.next).not.toHaveBeenCalled();
        expect(subscribeCallBackSpy.error).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                message: `Error while processing motor-settings-message: ${JSON.stringify(
                    motorSettingsMessage,
                    null,
                    2,
                )}. Settings were successfully applied to motor, but failed to persist.`,
            }),
        );
        expect(spyOnMotorSettingsReceiver).toHaveBeenCalled();
    });

    it("should return an observable that publishes an error, if the ros-service returns a 'unsuccessful'-message after sending motor-settings-message", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (_msg, callback, _failedCallback) => {
                const res: MotorSettingsSrvResponse = {
                    settings_applied: false,
                    settings_persisted: false,
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

        expect(subscribeCallBackSpy.next).not.toHaveBeenCalled();
        expect(subscribeCallBackSpy.error).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                message: `Error while processing motor-settings-message: ${JSON.stringify(
                    motorSettingsMessage,
                    null,
                    2,
                )}. Setting were neither applied to motor, nor were they persisted.`,
            }),
        );
        expect(spyOnMotorSettingsReceiver).not.toHaveBeenCalled();
    });

    it("should return an observable that publishes an error, if failed to send the motor-settings message to ros", () => {
        spyOn(rosService["motorSettingsService"], "callService").and.callFake(
            (_msg, _callback, failedCallback) => {
                failedCallback?.("test error message");
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

        expect(subscribeCallBackSpy.next).not.toHaveBeenCalled();
        expect(subscribeCallBackSpy.error).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                message: "test error message",
            }),
        );
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
