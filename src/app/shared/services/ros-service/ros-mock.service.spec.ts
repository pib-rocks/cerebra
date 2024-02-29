import {
    TestBed,
    discardPeriodicTasks,
    fakeAsync,
    flush,
    tick,
} from "@angular/core/testing";

import {RosService} from "./ros-mock.service";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {orangeJpegBase64, redJpegBase64} from "./ros-mock-data";
import {BehaviorSubject} from "rxjs";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {GoalStatus} from "../../ros-types/action/goal-status";
import {ApiService} from "../api.service";

describe("RosMockService", () => {
    let service: RosService;
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            ApiService.name,
            ["get", "post", "put", "delete"],
        );

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ApiService,
                    useValue: apiServiceSpy,
                },
                RosService,
            ],
        });

        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        service = TestBed.inject(RosService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("run a program", fakeAsync(() => {
        const consoleInfoSpy = spyOn(console, "info");
        const handle = (
            service.runProgram("test-program") as BehaviorSubject<
                GoalHandle<RunProgramFeedback, RunProgramResult>
            >
        ).value;
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"program_number":"test-program"}',
        );

        const feedbackSubscriber = jasmine.createSpy("feedback");
        const statusSubscriber = jasmine.createSpy("status");
        const resultSubscriber = jasmine.createSpy("result");

        handle.feedback.subscribe(feedbackSubscriber);
        handle.status.subscribe(statusSubscriber);
        handle.result.subscribe(resultSubscriber);

        tick(0);
        expect(statusSubscriber).toHaveBeenCalledTimes(1);
        expect(statusSubscriber).toHaveBeenCalledWith(GoalStatus.ACCEPT);
        tick(500);
        expect(feedbackSubscriber).toHaveBeenCalledTimes(1);
        expect(feedbackSubscriber).toHaveBeenCalledWith({
            output_lines: [
                {
                    is_stderr: false,
                    content: "hello",
                },
            ],
        });
        tick(500);
        expect(feedbackSubscriber).toHaveBeenCalledTimes(2);
        expect(feedbackSubscriber).toHaveBeenCalledWith({
            output_lines: [
                {
                    is_stderr: false,
                    content: "world",
                },
            ],
        });
        tick(500);
        expect(resultSubscriber).toHaveBeenCalledTimes(1);
        expect(resultSubscriber).toHaveBeenCalledWith({exit_code: 0});
        tick(500);
        expect(statusSubscriber).toHaveBeenCalledTimes(2);
        expect(statusSubscriber).toHaveBeenCalledWith(GoalStatus.SUCCEED);
        flush();
    }));

    it("should cancel a program, if it is not terminated yes", fakeAsync(() => {
        const handle = (
            service.runProgram("test-program") as BehaviorSubject<
                GoalHandle<RunProgramFeedback, RunProgramResult>
            >
        ).value;
        const feedbackSubscriber = jasmine.createSpy("feedback");
        const statusSubscriber = jasmine.createSpy("status");
        const resultSubscriber = jasmine.createSpy("result");

        handle.feedback.subscribe(feedbackSubscriber);
        handle.status.subscribe(statusSubscriber);
        handle.result.subscribe(resultSubscriber);

        tick(0);
        handle.cancel();
        tick(2000);

        expect(statusSubscriber).toHaveBeenCalledTimes(2);
        expect(statusSubscriber).toHaveBeenCalledWith(GoalStatus.ACCEPT);
        expect(statusSubscriber).toHaveBeenCalledWith(GoalStatus.CANCELED);
        expect(feedbackSubscriber).not.toHaveBeenCalled();
        expect(resultSubscriber).toHaveBeenCalledOnceWith({exit_code: 2});

        flush();
    }));

    it("should not cancel a program if it is already terminated", fakeAsync(() => {
        const handle = (
            service.runProgram("test-program") as BehaviorSubject<
                GoalHandle<RunProgramFeedback, RunProgramResult>
            >
        ).value;
        const clearTimeoutSpy = spyOn(window, "clearTimeout");
        tick(2000);
        handle.cancel();
        tick(2000);
        expect(clearTimeoutSpy).not.toHaveBeenCalled();
        flush();
    }));

    it("should start the voice-assistant if not started yet", fakeAsync(() => {
        const oldState = {turned_on: false, chat_id: ""};
        const newState = {turned_on: true, chat_id: "test-chat"};
        apiService.post.and.returnValue(
            new BehaviorSubject({
                content: "hello",
                timestamp: "1970-01-01T:01:01:01Z",
                isUser: true,
                messageId: "1234",
            }),
        );
        service["voiceAssistantState"] = oldState;
        const subscriber = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const stateReceiverSpy = spyOn(
            service["voiceAssistantStateReceiver$"],
            "next",
        );
        const consoleInfoSpy = spyOn(console, "info");
        service.setVoiceAssistantState(newState).subscribe(subscriber);
        expect(stateReceiverSpy).toHaveBeenCalledOnceWith(newState);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"turned_on":true,"chat_id":"test-chat"}',
        );
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.error).not.toHaveBeenCalled();
        flush();
    }));

    it("should stop the voice-assistant if not stopped yet", fakeAsync(() => {
        const oldState = {turned_on: true, chat_id: "test-chat"};
        const newState = {turned_on: false, chat_id: ""};
        apiService.post.and.returnValue(
            new BehaviorSubject({
                content: "hello",
                timestamp: "1970-01-01T:01:01:01Z",
                isUser: true,
                messageId: "1234",
            }),
        );
        service["voiceAssistantState"] = oldState;
        const subscriber = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const stateReceiverSpy = spyOn(
            service["voiceAssistantStateReceiver$"],
            "next",
        );
        const consoleInfoSpy = spyOn(console, "info");
        service.setVoiceAssistantState(newState).subscribe(subscriber);
        expect(stateReceiverSpy).toHaveBeenCalledOnceWith(newState);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"turned_on":false,"chat_id":""}',
        );
        expect(subscriber.next).toHaveBeenCalledTimes(1);
        expect(subscriber.error).not.toHaveBeenCalled();
        flush();
    }));

    it("should not start the voice-assistant if already started", fakeAsync(() => {
        const oldState = {turned_on: true, chat_id: "test-chat"};
        const newState = {turned_on: true, chat_id: "test-chat"};
        apiService.post.and.returnValue(
            new BehaviorSubject({
                content: "hello",
                timestamp: "1970-01-01T:01:01:01Z",
                isUser: true,
                messageId: "1234",
            }),
        );
        service["voiceAssistantState"] = oldState;
        const subscriber = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const stateReceiverSpy = spyOn(
            service["voiceAssistantStateReceiver$"],
            "next",
        );
        const consoleInfoSpy = spyOn(console, "info");
        service.setVoiceAssistantState(newState).subscribe(subscriber);
        expect(stateReceiverSpy).toHaveBeenCalledOnceWith(oldState);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"turned_on":true,"chat_id":"test-chat"}',
        );
        expect(subscriber.error).toHaveBeenCalledTimes(1);
        expect(subscriber.next).not.toHaveBeenCalled();
        flush();
    }));

    it("should not stop the voice-assistant if already stopped", fakeAsync(() => {
        const oldState = {turned_on: false, chat_id: ""};
        const newState = {turned_on: false, chat_id: ""};
        apiService.post.and.returnValue(
            new BehaviorSubject({
                content: "hello",
                timestamp: "1970-01-01T:01:01:01Z",
                isUser: true,
                messageId: "1234",
            }),
        );
        service["voiceAssistantState"] = oldState;
        const subscriber = jasmine.createSpyObj("subscriber", [
            "next",
            "error",
        ]);
        const stateReceiverSpy = spyOn(
            service["voiceAssistantStateReceiver$"],
            "next",
        );
        const consoleInfoSpy = spyOn(console, "info");
        service.setVoiceAssistantState(newState).subscribe(subscriber);
        expect(stateReceiverSpy).toHaveBeenCalledOnceWith(oldState);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"turned_on":false,"chat_id":""}',
        );
        expect(subscriber.error).toHaveBeenCalledTimes(1);
        expect(subscriber.next).not.toHaveBeenCalled();
        flush();
    }));

    it("should receive messages from the voice-assistant, after starting", fakeAsync(() => {
        service["voiceAssistantState"] = {
            turned_on: false,
            chat_id: "test-chat",
        };
        service.setVoiceAssistantState({chat_id: "test-chat", turned_on: true});
        const chatMessageReceiverSpy = spyOn(
            service["chatMessageReceiver$"],
            "next",
        );
        const userMessage = {
            messageId: "abcd",
            timestamp: "1970-01-01T01:01:01Z",
            isUser: true,
            content: "hello, pib!",
        };
        const vaMessage = {
            messageId: "efgh",
            timestamp: "1970-01-01T01:01:02Z",
            isUser: false,
            content: "hello, user!",
        };
        apiService.post.and.returnValues(
            new BehaviorSubject(userMessage),
            new BehaviorSubject(vaMessage),
        );
        tick(500);
        expect(chatMessageReceiverSpy).toHaveBeenCalledTimes(1);
        expect(chatMessageReceiverSpy).toHaveBeenCalledWith({
            chat_id: "test-chat",
            message_id: "abcd",
            timestamp: "1970-01-01T01:01:01Z",
            is_user: true,
            content: "hello, pib!",
        });
        tick(500);
        expect(chatMessageReceiverSpy).toHaveBeenCalledTimes(2);
        expect(chatMessageReceiverSpy).toHaveBeenCalledWith({
            chat_id: "test-chat",
            message_id: "efgh",
            timestamp: "1970-01-01T01:01:02Z",
            is_user: false,
            content: "hello, user!",
        });
        flush();
    }));

    it("should stop receiving messages from the voice-assistant, after stopping", fakeAsync(() => {
        service["voiceAssistantState"] = {
            turned_on: false,
            chat_id: "test-chat",
        };
        service.setVoiceAssistantState({chat_id: "test-chat", turned_on: true});
        const chatMessageReceiverSpy = spyOn(
            service["chatMessageReceiver$"],
            "next",
        );
        const userMessage = {
            messageId: "abcd",
            timestamp: "1970-01-01T01:01:01Z",
            isUser: true,
            content: "hello, pib!",
        };
        const vaMessage = {
            messageId: "efgh",
            timestamp: "1970-01-01T01:01:02Z",
            isUser: false,
            content: "hello, user!",
        };
        apiService.post.and.returnValues(
            new BehaviorSubject(userMessage),
            new BehaviorSubject(vaMessage),
        );
        tick(500);
        expect(chatMessageReceiverSpy).toHaveBeenCalledTimes(1);
        expect(chatMessageReceiverSpy).toHaveBeenCalledWith({
            chat_id: "test-chat",
            message_id: "abcd",
            timestamp: "1970-01-01T01:01:01Z",
            is_user: true,
            content: "hello, pib!",
        });
        service.setVoiceAssistantState({chat_id: "", turned_on: false});
        tick(500);
        expect(chatMessageReceiverSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it("should send a joint trajectory message", () => {
        const consoleInfoSpy = spyOn(console, "info");
        const sendJointTrajectorySpy = spyOn(
            service["jointTrajectoryReceiver$"],
            "next",
        );
        const jt = {
            header: {
                stamp: {
                    sec: 1,
                    nanosec: 2,
                },
                frame_id: "",
            },
            joint_names: [],
            points: [],
        };
        service.sendJointTrajectoryMessage(jt);
        expect(sendJointTrajectorySpy).toHaveBeenCalledOnceWith(jt);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"header":{"stamp":{"sec":1,"nanosec":2},"frame_id":""},"joint_names":[],"points":[]}',
        );
    });

    it("should send a motor-settings message", () => {
        const consoleInfoSpy = spyOn(console, "info");
        const sendMotorSettingsSpy = spyOn(
            service["motorSettingsReceiver$"],
            "next",
        );
        const motorSettingsMessage: MotorSettingsMessage = {
            motor_name: "test-motor",
            turned_on: false,
            pulse_width_min: 0,
            pulse_width_max: 1,
            rotation_range_min: 2,
            rotation_range_max: 3,
            velocity: 4,
            acceleration: 5,
            deceleration: 6,
            period: 7,
            invert: false,
            visible: false,
        };
        const motorSettings = {
            turnedOn: false,
            pulseWidthMin: 0,
            pulseWidthMax: 1,
            rotationRangeMin: 2,
            rotationRangeMax: 3,
            velocity: 4,
            acceleration: 5,
            deceleration: 6,
            period: 7,
            invert: false,
            visible: false,
        };
        apiService.put.and.returnValue(new BehaviorSubject(motorSettings));
        service.sendMotorSettingsMessage(motorSettingsMessage);
        expect(sendMotorSettingsSpy).toHaveBeenCalledOnceWith(
            motorSettingsMessage,
        );
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith(
            '{"motor_name":"test-motor","turned_on":false,"pulse_width_min":0,"pulse_width_max":1,"rotation_range_min":2,"rotation_range_max":3,"velocity":4,"acceleration":5,"deceleration":6,"period":7,"invert":false,"visible":false}',
        );
    });

    it("should set the quality factor", () => {
        const consoleInfoSpy = spyOn(console, "info");
        const setQualityFactorSpy = spyOn(
            service["cameraQualityFactorReceiver$"],
            "next",
        );
        service.setQualityFactor(2);
        expect(setQualityFactorSpy).toHaveBeenCalledOnceWith(2);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith('{"data":2}');
    });

    it("should set the preview size", () => {
        const consoleInfoSpy = spyOn(console, "info");
        const setPreviewSizeSpy = spyOn(
            service["cameraPreviewSizeReceiver$"],
            "next",
        );
        service.setPreviewSize(1, 2);
        expect(setPreviewSizeSpy).toHaveBeenCalledOnceWith([1, 2]);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith('{"data":[1,2]}');
    });

    it("should set the timer period", () => {
        const consoleInfoSpy = spyOn(console, "info");
        const setTimerPeriodSpy = spyOn(
            service["cameraTimerPeriodReceiver$"],
            "next",
        );
        service.setTimerPeriod(2);
        expect(setTimerPeriodSpy).toHaveBeenCalledOnceWith(2);
        expect(consoleInfoSpy).toHaveBeenCalledOnceWith('{"data":2}');
    });

    it("should subscribe to the camera topic", fakeAsync(() => {
        service.cameraTimer = undefined;
        const setIntervalSpy = spyOn(window, "setInterval").and.callThrough();
        const cameraReceiverSpy = spyOn(service["cameraReceiver$"], "next");
        service.subscribeCameraTopic();
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        tick(500);
        expect(cameraReceiverSpy).toHaveBeenCalledTimes(1);
        expect(cameraReceiverSpy).toHaveBeenCalledWith(redJpegBase64);
        tick(500);
        expect(cameraReceiverSpy).toHaveBeenCalledTimes(2);
        expect(cameraReceiverSpy).toHaveBeenCalledWith(orangeJpegBase64);
        discardPeriodicTasks();
    }));

    it("should not subscribe if already subscribed", () => {
        service.cameraTimer = 21;
        const setIntervalSpy = spyOn(window, "setInterval");
        service.unsubscribeCameraTopic();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it("should unsubscribe from the camera topic", () => {
        service.cameraTimer = 21;
        const clearIntervalSpy = spyOn(window, "clearInterval");
        service.unsubscribeCameraTopic();
        expect(service.cameraTimer).toBeUndefined();
        expect(clearIntervalSpy).toHaveBeenCalledOnceWith(21);
    });
});
