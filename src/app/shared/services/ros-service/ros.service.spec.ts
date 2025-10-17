import {TestBed, waitForAsync} from "@angular/core/testing";
import * as ROSLIB from "roslib";
import {RosService} from "./ros.service";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {ApplyMotorSettingsResponse} from "../../ros-types/srv/apply-motor-settings";
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
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";
import {SetSolidStateRelayStateResponse} from "../../ros-types/srv/set-solid-state-relay-state";

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
        invert: false,
    };

    let subscriber: jasmine.SpyObj<any>;
    const chatId = "chat-id";
    const chatMessageContent = "hello world";

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RosService],
        });

        rosService = TestBed.inject(RosService);
        rosService["initTopicsAndServices"]();
        spyOnSetupRos = spyOn<any>(rosService, "setUpRos").and.callThrough();

        subscriber = jasmine.createSpyObj("subscriber", ["next", "error"]);
    });

    it("should be created", () => {
        expect(rosService).toBeTruthy();
    });

    it("should establish ros in the constructor", () => {
        rosService["setUpRos"]();
        expect(spyOnSetupRos).toHaveBeenCalled();
    });

    it("should create all ROSLIB topics and services", () => {
        expect(rosService["jointTrajectoryTopic"]).toBeTruthy();
        expect(rosService["motorCurrentTopic"]).toBeTruthy();
        expect(rosService["cameraTopic"]).toBeTruthy();
        expect(rosService["cameraTimerPeriodTopic"]).toBeTruthy();
        expect(rosService["cameraQualityFactorTopic"]).toBeTruthy();
        expect(rosService["cameraPreviewSizeTopic"]).toBeTruthy();
        expect(rosService["applyMotorSettingsService"]).toBeTruthy();
        expect(rosService["voiceAssistantStateTopic"]).toBeTruthy();
        expect(rosService["setVoiceAssistantStateService"]).toBeTruthy();
        expect(rosService["chatMessageTopic"]).toBeTruthy();
        expect(rosService["chatIsListeningTopic"]).toBeTruthy();
        expect(rosService["existTokenService"]).toBeTruthy();
        expect(rosService["encryptTokenService"]).toBeTruthy();
        expect(rosService["decryptTokenService"]).toBeTruthy();
        expect(rosService["deleteTokenTopic"]).toBeTruthy();
        expect(rosService["solidStateRelayStateTopic"]).toBeTruthy();
        expect(rosService["setSolidStateRelayStateService"]).toBeTruthy();
    });

    it("should call the set_voice_assistant_state ros service", () => {
        const setVoiceAssistantStateSpy = spyOn(
            rosService["setVoiceAssistantStateService"],
            "callService",
        ).and.callFake((_msg, callback) => {
            const res: SetVoiceAssistantStateResponse = {successful: true};
            callback(res);
        });
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        rosService.setVoiceAssistantState(state).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.error).not.toHaveBeenCalled();
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
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        rosService.setVoiceAssistantState(state).subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledOnceWith(
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
            if (errorCallback) errorCallback("error-message");
        });
        const state: VoiceAssistantState = {
            turned_on: true,
            chat_id: "test-chat-id",
        };
        rosService.setVoiceAssistantState(state).subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledWith(jasmine.any(Error));
        expect(subscriber.error.calls.mostRecent().args[0].message).toBe(
            "error-message",
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
        spyOn<any>(rosService, "createRosService").and.returnValue(
            getVoiceAssistantStateServiceSpy,
        );
        const voiceAssistantStateReceiverSpy = spyOn(
            rosService.voiceAssistantStateReceiver$,
            "next",
        );

        rosService["subscribeVoiceAssistantStateTopic"]();

        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledTimes(2);
        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledWith(state1);
        expect(voiceAssistantStateReceiverSpy).toHaveBeenCalledWith(state2);
        expect(subscribeVoiceAssistantStateTopicSpy).toHaveBeenCalledTimes(1);
        expect(
            getVoiceAssistantStateServiceSpy.callService,
        ).toHaveBeenCalledTimes(1);
    });

    it("should notify, that the jt was applied, by publihsing to the observable", () => {
        const jt = {} as JointTrajectoryMessage;
        spyOn(
            rosService["applyJointTrajectoryService"],
            "callService",
        ).and.callFake((_jt, resolve, _reject) => {
            resolve({successful: true});
        });
        rosService.applyJointTrajectory(jt).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalled();
        expect(subscriber.error).not.toHaveBeenCalled();
    });

    it("should return an error, if communication with ros was not successful", () => {
        const jt = {} as JointTrajectoryMessage;
        spyOn(
            rosService["applyJointTrajectoryService"],
            "callService",
        ).and.callFake((_jt, _resolve, reject) => {
            reject?.("error");
        });
        rosService.applyJointTrajectory(jt).subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalled();
    });

    it("should return an error, if communication with ros was successful, but jt could not be applied", () => {
        const jt = {} as JointTrajectoryMessage;
        spyOn(
            rosService["applyJointTrajectoryService"],
            "callService",
        ).and.callFake((_jt, resolve, _reject) => {
            resolve({successful: false});
        });
        rosService.applyJointTrajectory(jt).subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalled();
    });

    it("should call the service with the MotorSettingsMessage on calling applyMotorSettings", () => {
        const spyOnSendMotorSettingsMessage = spyOn(
            rosService,
            "applyMotorSettings",
        ).and.callThrough();
        const spyMotorSettingsServiceCall = spyOn(
            rosService["applyMotorSettingsService"],
            "callService",
        );
        rosService.applyMotorSettings(motorSettingsMessage);
        expect(spyOnSendMotorSettingsMessage).toHaveBeenCalled();
        expect(spyMotorSettingsServiceCall).toHaveBeenCalled();
    });

    it("should handle the case correctly, where, after calling applyMotorSettings(), the applyMotorSettingsService calls the success-callback with a message that indicates, that both application as well as persistence were successul", () => {
        spyOn(
            rosService["applyMotorSettingsService"],
            "callService",
        ).and.callFake((_msg, callback) => {
            const res: ApplyMotorSettingsResponse = {
                settings_applied: true,
                settings_persisted: true,
            };
            callback(res);
        });
        spyOn(rosService.motorSettingsReceiver$, "next");

        const obs: Observable<MotorSettingsMessage> =
            rosService.applyMotorSettings(motorSettingsMessage);
        obs.subscribe(subscriber);

        expect(subscriber.next).toHaveBeenCalledOnceWith(motorSettingsMessage);
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
            ROSLIB.Service<ProxyRunProgramStopRequest, Record<string, never>>
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
                mpid: 0,
                proxy_goal_id: "test-proxy-goal-id",
                output_lines: [{is_stderr: true, content: "test 1"}],
            });
            statusSubject.next({
                proxy_goal_id: "test-proxy-goal-id",
                status: 1,
            });

            feedbackSubject.next({
                mpid: 1,
                proxy_goal_id: "other-proxy-goal-id",
                output_lines: [{is_stderr: true, content: "test 2"}],
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
                mpid: 0,
                proxy_goal_id: "test-proxy-goal-id",
                output_lines: [{is_stderr: true, content: "test 3"}],
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
                    output_lines: [{is_stderr: true, content: "test 1"}],
                }),
            );
            expect(feedbackSubscriber.next).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    output_lines: [{is_stderr: true, content: "test 3"}],
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
                jasmine.any(Function),
            );
        });
    }));

    it("should get the listening state", () => {
        const isListeningResponse = {listening: true};
        const callServiceSpy = spyOn(
            rosService["getChatIsListeningService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback(isListeningResponse);
        });
        rosService.getChatIsListening(chatId).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledOnceWith(
            isListeningResponse.listening,
        );
        expect(subscriber.error).not.toHaveBeenCalled();
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {chat_id: chatId},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should publish an error when requesting listening state", () => {
        const callServiceSpy = spyOn(
            rosService["getChatIsListeningService"],
            "callService",
        ).and.callFake((_request, _successCallback, errorCallback) => {
            errorCallback?.("some error");
        });
        rosService.getChatIsListening(chatId).subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledOnceWith(
            new Error("some error"),
        );
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {chat_id: chatId},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should send a chat message", () => {
        const callServiceSpy = spyOn(
            rosService["sendChatMessageService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback({successful: true});
        });
        rosService
            .sendChatMessage(chatId, chatMessageContent)
            .subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledOnceWith(undefined);
        expect(subscriber.error).not.toHaveBeenCalled();
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {chat_id: chatId, content: chatMessageContent},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should handle unsuccessful message sending correctly", () => {
        const callServiceSpy = spyOn(
            rosService["sendChatMessageService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback({successful: false});
        });
        rosService
            .sendChatMessage(chatId, chatMessageContent)
            .subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledTimes(1);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {chat_id: chatId, content: chatMessageContent},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should handle failed communication with ros for sending a chat message correctly", () => {
        const callServiceSpy = spyOn(
            rosService["sendChatMessageService"],
            "callService",
        ).and.callFake((_request, _successCallback, errorCallback) => {
            errorCallback?.("some error");
        });
        rosService
            .sendChatMessage(chatId, chatMessageContent)
            .subscribe(subscriber);
        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledTimes(1);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {chat_id: chatId, content: chatMessageContent},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should check if token exists", () => {
        const callServiceSpy = spyOn(
            rosService["existTokenService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback({token_exists: false, token_active: false});
        });

        rosService.checkTokenExists().subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should encrypt token", () => {
        const token = "testToken";
        const password = "testPassword";

        const callServiceSpy = spyOn(
            rosService["encryptTokenService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback({successful: true});
        });

        rosService.encryptToken(token, password).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.next).toHaveBeenCalledWith(true);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {token: token, password: password},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should return false on error encrypt token", () => {
        const token = "testToken";
        const password = "testPassword";

        const callServiceSpy = spyOn(
            rosService["encryptTokenService"],
            "callService",
        ).and.callFake((_request, _successCallback, errorCallback) => {
            errorCallback?.("some error");
        });

        rosService.encryptToken(token, password).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.next).toHaveBeenCalledWith(false);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {token: token, password: password},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should decrypt token", () => {
        const password = "testPassword";

        const callServiceSpy = spyOn(
            rosService["decryptTokenService"],
            "callService",
        ).and.callFake((_request, successCallback, _errorCallback) => {
            successCallback({successful: true});
        });

        rosService.decryptToken(password).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.next).toHaveBeenCalledWith(true);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {password: password},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should return false on error decrypt token", () => {
        const password = "testPassword";

        const callServiceSpy = spyOn(
            rosService["decryptTokenService"],
            "callService",
        ).and.callFake((_request, _successCallback, errorCallback) => {
            errorCallback?.("some error");
        });

        rosService.decryptToken(password).subscribe(subscriber);
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.next).toHaveBeenCalledWith(false);
        expect(callServiceSpy).toHaveBeenCalledOnceWith(
            {password: password},
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });

    it("should subscribe to the solid-state-relay-topic and receive the correct state", () => {
        const state: SolidStateRelayState = {
            turned_on: true,
        };
        const subscribeSolidStateRelayStateTopicSpy = spyOn(
            rosService["solidStateRelayStateTopic"],
            "subscribe",
        ).and.callFake((callback: (msg: SolidStateRelayState) => void) =>
            callback(state),
        );

        const solidStateRelayStateReceiverSpy = spyOn(
            rosService.solidStateRelayStateReceiver$,
            "next",
        );

        rosService["subscribeSolidStateRelayStateTopic"]();

        expect(subscribeSolidStateRelayStateTopicSpy).toHaveBeenCalledTimes(1);
        expect(solidStateRelayStateReceiverSpy).toHaveBeenCalledTimes(1);
        expect(solidStateRelayStateReceiverSpy).toHaveBeenCalledWith(state);
    });

    it("should call the setSolidStateRelayState ros service and handle success response", () => {
        const setSolidStateRelayStateSpy = spyOn(
            rosService["setSolidStateRelayStateService"],
            "callService",
        ).and.callFake((_msg, successCallback) => {
            const res: SetSolidStateRelayStateResponse = {successful: true};
            successCallback(res);
        });
        const state: SolidStateRelayState = {
            turned_on: true,
        };

        rosService.setSolidStateRelayState(state).subscribe(subscriber);

        expect(setSolidStateRelayStateSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                solid_state_relay_state: state,
            }),
            jasmine.any(Function),
            jasmine.any(Function),
        );
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.error).not.toHaveBeenCalled();
    });

    it("should publish an error if the solid state relay state could not be set", () => {
        const setSolidStateRelayStateSpy = spyOn(
            rosService["setSolidStateRelayStateService"],
            "callService",
        ).and.callFake((_msg, callback) => {
            const res: SetSolidStateRelayStateResponse = {successful: false};
            callback(res);
        });
        const state: SolidStateRelayState = {
            turned_on: true,
        };

        rosService.setSolidStateRelayState(state).subscribe(subscriber);

        expect(subscriber.next).not.toHaveBeenCalled();
        expect(subscriber.error).toHaveBeenCalledTimes(1);
        expect(subscriber.error.calls.mostRecent().args[0]).toEqual(
            new Error("could not apply solid state relay state..."),
        );
        expect(setSolidStateRelayStateSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                solid_state_relay_state: state,
            }),
            jasmine.any(Function),
            jasmine.any(Function),
        );
    });
});
