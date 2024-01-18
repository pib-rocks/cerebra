import {TestBed} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "../../ros-message-types/jointTrajectoryMessage";
import {MotorSettingsMessage} from "../../ros-message-types/motorSettingsMessage";
import {MotorSettingsSrvResponse} from "../../ros-message-types/motorSettingsSrvResponse";
import {Observable} from "rxjs";
import {VoiceAssistantState} from "../../ros-message-types/VoiceAssistantState";
import {SetVoiceAssistantStateResponse} from "../../ros-message-types/SetVoiceAssistantState";

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
        expect(rosService["motorSettingsService"]).toBeTruthy();
        expect(rosService["voiceAssistantStateTopic"]).toBeTruthy();
        expect(rosService["setVoiceAssistantStateService"]).toBeTruthy();
        expect(rosService["chatMessageTopic"]).toBeTruthy();
    });

    it("should call the set_voice_assistant_state ros service", () => {
        const setVoiceAssistantStateSpy = spyOn(
            rosService["setVoiceAssistantStateService"],
            "callService",
        ).and.callFake((_msg, callback) => {
            const res: SetVoiceAssistantStateResponse = {successful: true};
            callback(res);
        });
        const subscribeObject = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        const subject = rosService.setVoiceAssistantState(state);
        subject.subscribe(subscribeObject);
        expect(subscribeObject.next).toHaveBeenCalledTimes(1);
        expect(subscribeObject.error).not.toHaveBeenCalled();
        expect(setVoiceAssistantStateSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                voice_assistant_state: state,
            }),
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should publish an error if the voice assistant state could not be set", () => {
        const setVoiceAssistantStateSpy = spyOn(
            rosService["setVoiceAssistantStateService"],
            "callService",
        ).and.callFake((_msg, callback) => {
            const res: SetVoiceAssistantStateResponse = {successful: false};
            callback(res);
        });
        const subscribeObject = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        const subject = rosService.setVoiceAssistantState(state);
        subject.subscribe(subscribeObject);
        expect(subscribeObject.next).not.toHaveBeenCalled();
        expect(subscribeObject.error).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(new Error("could not apply state...")),
        );
        expect(setVoiceAssistantStateSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                voice_assistant_state: state,
            }),
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should publish an error if the communication with ROS fails", () => {
        const setVoiceAssistantStateSpy = spyOn(
            rosService["setVoiceAssistantStateService"],
            "callService",
        ).and.callFake((_msg, _callback, errorCallback) => {
            if (errorCallback) errorCallback("errror-message");
        });
        const subscribeObject = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        const subject = rosService.setVoiceAssistantState(state);
        subject.subscribe(subscribeObject);
        expect(subscribeObject.next).not.toHaveBeenCalled();
        expect(subscribeObject.error).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(new Error("error-message")),
        );
        expect(setVoiceAssistantStateSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                voice_assistant_state: state,
            }),
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should subscribe to the voice-assistant-topic and retrieve the initial state", () => {
        const state1: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id-1",
        };
        const state2: VoiceAssistantState = {
            turned_on: false,
            chat_id: "test-chat-id-2",
        };
        const subscribeVoiceAssistantStateTopicSpy = spyOn(
            rosService["voiceAssistantStateTopic"],
            "subscribe",
        ).and.callFake((callback) => callback(state1));
        const getVoiceAssistantStateServiceSpy = jasmine.createSpyObj(
            "get-voice-assistant-state",
            ["callService"],
        );
        getVoiceAssistantStateServiceSpy.callService.and.callFake(
            (_msg: any, callback: any, _errorCallback: any) =>
                callback({
                    voice_assistant_state: state2,
                }),
        );
        spyOn(rosService, "createRosService").and.returnValue(
            getVoiceAssistantStateServiceSpy,
        );
        const voiceAssistantStateReceiverSpy = spyOn(
            rosService.voiceAssistantStateReceiver$,
            "next",
        );

        rosService.subscribeVoiceAssistantStateTopic();

        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledTimes(2);
        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledWith(state1);
        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledWith(state2);
        expect(subscribeVoiceAssistantStateTopicSpy).toHaveBeenCalledTimes(1);
        expect(
            getVoiceAssistantStateServiceSpy.callService,
        ).toHaveBeenCalledTimes(1);
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
            (_msg, callback) => {
                const res: MotorSettingsSrvResponse = {
                    settings_applied: true,
                    settings_persisted: true,
                };
                callback(res);
            },
        );
        spyOn(rosService.motorSettingsReceiver$, "next");

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
