import {Injectable} from "@angular/core";
import {BehaviorSubject, Subject, Observable, ReplaySubject, first} from "rxjs";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {DiagnosticStatus} from "../../ros-types/msg/diagnostic-status.message";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {ChatMessage} from "../../ros-types/msg/chat-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {orangeJpegBase64, redJpegBase64} from "./ros-mock-data";
import {GoalStatus, isTerminal} from "../../ros-types/action/goal-status";
import {IRosService} from "./i-ros-service";

@Injectable({
    providedIn: "root",
})
export class RosService implements IRosService {
    private voiceAssistantState: VoiceAssistantState = {
        turned_on: false,
        chat_id: "",
    };
    uuidCounter: number = 0;
    userMessageTimeout: any;
    vaMessageTimeout: any;

    currentReceiver$: Subject<DiagnosticStatus> =
        new Subject<DiagnosticStatus>();
    cameraTimerPeriodReceiver$: BehaviorSubject<number> =
        new BehaviorSubject<number>(0.1);
    cameraReceiver$: Subject<string> = new Subject<string>();
    cameraPreviewSizeReceiver$: BehaviorSubject<number[]> = new BehaviorSubject<
        number[]
    >([0, 0]);
    cameraQualityFactorReceiver$: BehaviorSubject<number> =
        new BehaviorSubject<number>(80);
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage> =
        new Subject<JointTrajectoryMessage>();
    motorSettingsReceiver$: Subject<MotorSettingsMessage> =
        new Subject<MotorSettingsMessage>();
    proxyRunProgramFeedbackReceiver$: Subject<ProxyRunProgramFeedback> =
        new Subject<ProxyRunProgramFeedback>();
    proxyRunProgramResultReceiver$: Subject<ProxyRunProgramResult> =
        new Subject<ProxyRunProgramResult>();
    proxyRunProgramStatusReceiver$: Subject<ProxyRunProgramStatus> =
        new Subject<ProxyRunProgramStatus>();
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState> =
        new BehaviorSubject<VoiceAssistantState>({
            turned_on: false,
            chat_id: "",
        });
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();

    cameraTimer: any;

    setVoiceAssistantState(
        voiceAssistantState: VoiceAssistantState,
    ): Observable<void> {
        console.info(JSON.stringify(voiceAssistantState));
        const subject = new ReplaySubject<void>();
        if (
            this.voiceAssistantState.turned_on == voiceAssistantState.turned_on
        ) {
            subject.error("could not apply state...");
        } else {
            subject.next();
            this.voiceAssistantState = structuredClone(voiceAssistantState);
            if (voiceAssistantState.turned_on) {
                this.userMessageTimeout = setTimeout(() => {
                    this.chatMessageReceiver$.next({
                        chat_id: this.voiceAssistantState.chat_id,
                        message_id: (this.uuidCounter++).toString(),
                        timestamp: "1970-01-01T01:01:01Z",
                        is_user: true,
                        content: "hello, pib!",
                    });
                }, 500);
                this.vaMessageTimeout = setTimeout(() => {
                    this.chatMessageReceiver$.next({
                        chat_id: this.voiceAssistantState.chat_id,
                        message_id: (this.uuidCounter++).toString(),
                        timestamp: "1970-01-01T01:01:01Z",
                        is_user: false,
                        content: "hello, user!",
                    });
                }, 1000);
            } else {
                clearTimeout(this.userMessageTimeout);
                clearTimeout(this.vaMessageTimeout);
            }
        }
        this.voiceAssistantStateReceiver$.next(
            structuredClone(this.voiceAssistantState),
        );
        return subject;
    }

    runProgram(
        programNumber: string,
    ): Observable<GoalHandle<RunProgramFeedback, RunProgramResult>> {
        console.info(JSON.stringify({program_number: programNumber}));

        const feedback: Subject<RunProgramFeedback> = new Subject();
        const status: Subject<GoalStatus> = new Subject();
        let currentStatus: number = 0;
        const result: Subject<RunProgramResult> = new Subject();

        const firstFeedbackTimer = setTimeout(
            () =>
                feedback.next({
                    output_lines: [
                        {
                            is_stderr: false,
                            content: "hello",
                        },
                    ],
                }),
            500,
        );
        const secondFeedbackTimer = setTimeout(
            () =>
                feedback.next({
                    output_lines: [
                        {
                            is_stderr: false,
                            content: "world",
                        },
                    ],
                }),
            1000,
        );
        const resultTimer = setTimeout(
            () =>
                result.next({
                    exit_code: 0,
                }),
            1500,
        );

        setTimeout(() => {
            currentStatus = GoalStatus.ACCEPT;
            status.next(currentStatus);
        }, 0);
        const succeedStatusTimer = setTimeout(() => {
            currentStatus = GoalStatus.SUCCEED;
            status.next(currentStatus);
        }, 2000);

        let cancelRequested: boolean = false;
        const cancel = () => {
            if (cancelRequested || isTerminal(currentStatus)) return;
            cancelRequested = true;
            clearTimeout(firstFeedbackTimer);
            clearTimeout(secondFeedbackTimer);
            clearTimeout(succeedStatusTimer);
            clearTimeout(resultTimer);
            setTimeout(() => {
                currentStatus = GoalStatus.CANCELED;
                status.next(currentStatus);
                result.next({exit_code: 2});
            }, 500);
        };

        return new BehaviorSubject({feedback, status, result, cancel});
    }

    sendMotorSettingsMessage(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        console.info(JSON.stringify(motorSettingsMessage));
        this.motorSettingsReceiver$.next(structuredClone(motorSettingsMessage));
        return new BehaviorSubject(motorSettingsMessage);
    }

    sendJointTrajectoryMessage(
        jointTrajectoryMessage: JointTrajectoryMessage,
    ): void {
        console.info(JSON.stringify(jointTrajectoryMessage));
        this.jointTrajectoryReceiver$.next(
            structuredClone(jointTrajectoryMessage),
        );
    }

    setTimerPeriod(period: number): void {
        console.info(JSON.stringify({data: period}));
        this.cameraTimerPeriodReceiver$.next(period);
    }

    setPreviewSize(width: number, height: number): void {
        console.info(JSON.stringify({data: [width, height]}));
        this.cameraPreviewSizeReceiver$.next([width, height]);
    }

    setQualityFactor(factor: number): void {
        console.info(JSON.stringify({data: factor}));
        this.cameraQualityFactorReceiver$.next(factor);
    }

    subscribeCameraTopic(): void {
        if (this.cameraTimer) return;
        let toggle: boolean = true;
        this.cameraTimer = setInterval(() => {
            toggle = !toggle;
            this.cameraReceiver$.next(
                toggle ? orangeJpegBase64 : redJpegBase64,
            );
        }, 500);
    }

    unsubscribeCameraTopic(): void {
        clearInterval(this.cameraTimer);
        this.cameraTimer = undefined;
    }
}
