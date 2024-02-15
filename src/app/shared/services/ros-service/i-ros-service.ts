import {BehaviorSubject, Observable, Subject} from "rxjs";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {JointTrajectoryMessage} from "../../ros-types/msg/joint-trajectory-message";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {VoiceAssistantState} from "../../ros-types/msg/voice-assistant-state";
import {DiagnosticStatus} from "../../ros-types/msg/diagnostic-status.message";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {ChatMessage} from "../../ros-types/msg/chat-message";

export interface IRosService {
    currentReceiver$: Subject<DiagnosticStatus>;
    cameraTimerPeriodReceiver$: BehaviorSubject<number>;
    cameraReceiver$: Subject<string>;
    cameraPreviewSizeReceiver$: BehaviorSubject<number[]>;
    cameraQualityFactorReceiver$: BehaviorSubject<number>;
    jointTrajectoryReceiver$: Subject<JointTrajectoryMessage>;
    motorSettingsReceiver$: Subject<MotorSettingsMessage>;
    proxyRunProgramFeedbackReceiver$: Subject<ProxyRunProgramFeedback>;
    proxyRunProgramResultReceiver$: Subject<ProxyRunProgramResult>;
    proxyRunProgramStatusReceiver$: Subject<ProxyRunProgramStatus>;
    voiceAssistantStateReceiver$: BehaviorSubject<VoiceAssistantState>;
    chatMessageReceiver$: Subject<ChatMessage>;

    setVoiceAssistantState: (
        voiceAssistantState: VoiceAssistantState,
    ) => Observable<void>;
    sendMotorSettingsMessage: (
        motorSettingsMessage: MotorSettingsMessage,
    ) => Observable<MotorSettingsMessage>;
    runProgram: (
        programNumber: string,
    ) => Observable<GoalHandle<RunProgramFeedback, RunProgramResult>>;
    sendJointTrajectoryMessage: (
        jointTrajectoryMessage: JointTrajectoryMessage,
    ) => void;
    setTimerPeriod: (period: number) => void;
    setPreviewSize: (width: number, height: number) => void;
    setQualityFactor: (factor: number) => void;
    subscribeCameraTopic: () => void;
    unsubscribeCameraTopic: () => void;
}
