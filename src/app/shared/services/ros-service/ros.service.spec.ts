import {TestBed, waitForAsync} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {createEmptyJointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {MotorSettingsServiceResponse} from "../../ros-types/srv/motor-settings-service";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramStopRequest} from "../../ros-types/srv/proxy-run-program-stop";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {
    ProxyRunProgramStartRequest,
    ProxyRunProgramStartResponse,
} from "../../ros-types/srv/proxy-run-program-start";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {SetVoiceAssistantStateResponse} from "../../ros-types/srv/set-voice-assistant-state";
import {Observable, Subject} from "rxjs";

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
        visible: true,
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
                const res: MotorSettingsServiceResponse = {
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

    it("should run a program", waitForAsync(() => {
        const feedbackSubject = new Subject<ProxyRunProgramFeedback>();
        const resultSubject = new Subject<ProxyRunProgramResult>();
        const statusSubject = new Subject<ProxyRunProgramStatus>();

        rosService.proxyRunProgramFeedbackReceiver$ = feedbackSubject;
        rosService.proxyRunProgramResultReceiver$ = resultSubject;
        rosService.proxyRunProgramStatusReceiver$ = statusSubject;

        const startSpy = jasmine.createSpyObj<
            ROSLIB.Service<
                ProxyRunProgramStartRequest,
                ProxyRunProgramStartResponse
            >
        >("proxy-run-program-start", ["callService"]);

        const stoptSpy = jasmine.createSpyObj<
            ROSLIB.Service<
                ProxyRunProgramStopRequest,
                ProxyRunProgramStopResponse
            >
        >("proxy-run-program-stop", ["callService"]);

        rosService["proxyProgramStartService"] = startSpy;
        rosService["proxyProgramStopService"] = stoptSpy;

        startSpy.callService.and.callFake((_request, callback) => {
            callback({proxy_goal_id: "test-proxy-goal-id"});
        });

        const programNumber = "test-uuid";

        rosService.runProgram(programNumber).subscribe((handle) => {
            const feedbackSubscriber = {next: jasmine.createSpy()};
            const resultSubscriber = {next: jasmine.createSpy()};
            const statusSubscriber = {next: jasmine.createSpy()};

            handle.feedback.subscribe(feedbackSubscriber);
            handle.result.subscribe(resultSubscriber);
            handle.status.subscribe(statusSubscriber);

            feedbackSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                is_stderr: true,
                output_line: "test 1",
            });
            statusSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                status: 1,
            });

            feedbackSubject.next({
                proxy_goal_id: "other-proxy-goal-id",
                is_stderr: true,
                output_line: "test 2",
            });
            statusSubject.next({
                proxy_goal_id: "other-proxy-goal-id",
                status: 2,
            });
            resultSubject.next({
                proxy_goal_id: "other-proxy-goal-id",
                exit_code: 2,
            });

            feedbackSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                is_stderr: true,
                output_line: "test 3",
            });
            statusSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                status: 3,
            });
            resultSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                exit_code: 3,
            });

            expect(feedbackSubscriber.next).toHaveBeenCalledTimes(2);
            expect(feedbackSubscriber.next).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    is_stderr: true,
                    output_line: "test 1",
                }),
            );
            expect(feedbackSubscriber.next).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    is_stderr: true,
                    output_line: "test 3",
                }),
            );

            expect(resultSubscriber.next).toHaveBeenCalledTimes(1);
            expect(resultSubscriber.next).toHaveBeenCalledWith(
                jasmine.objectContaining({exit_code: 3}),
            );

            expect(statusSubscriber.next).toHaveBeenCalledTimes(2);
            expect(statusSubscriber.next).toHaveBeenCalledWith(1);
            expect(statusSubscriber.next).toHaveBeenCalledWith(3);

            expect(startSpy.callService).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({program_number: programNumber}),
                jasmine.any(Function),
                jasmine.any(Function),
            );

            handle.cancel();

            expect(
                rosService["proxyProgramStopService"].callService,
            ).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({proxy_goal_id: "test-proxy-goal-id"}),
                jasmine.any(Function),
            );
        });
    }));
});
