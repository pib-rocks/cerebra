import {Injectable} from "@angular/core";
import {BehaviorSubject, Subject, Observable} from "rxjs";
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

@Injectable({
    providedIn: "root",
})
export class RosMockService {
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

    constructor() {}

    setVoiceAssistantState(
        voiceAssistantState: VoiceAssistantState,
    ): Observable<void> {
        return new Observable();
    }

    sendMotorSettingsMessage(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        return new Observable();
    }

    runProgram(
        programNumber: string,
    ): Observable<GoalHandle<RunProgramFeedback, RunProgramResult>> {
        return new Observable();
    }

    sendJointTrajectoryMessage(
        jointTrajectoryMessage: JointTrajectoryMessage,
    ): void {
        return;
    }

    setTimerPeriod(period: number | null): void {
        return;
    }

    setPreviewSize(width: number, height: number): void {
        return;
    }

    setQualityFactor(factor: number | null): void {
        return;
    }
}
