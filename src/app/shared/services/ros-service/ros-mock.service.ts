import {Injectable} from "@angular/core";
import {
    BehaviorSubject,
    Subject,
    Observable,
    ReplaySubject,
    throwError,
    tap,
    of,
} from "rxjs";
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
import {ApiService} from "../api.service";
import {UrlConstants} from "../url.constants";
import {MotorSettingsError} from "../../error/motor-settings-error";
import {ChatIsListening} from "../../ros-types/msg/chat-is-listening";
import {motors} from "../../types/motor-configuration";
import {ExistTokenResponse} from "../../ros-types/srv/exist-token";
import {SolidStateRelayState} from "../../ros-types/msg/solid-state-relay-state";

@Injectable({
    providedIn: "root",
})
export class RosService implements IRosService {
    private setIsListening(chatId: string, listening: boolean) {
        this.isListeningFromChatId.set(chatId, listening);
        this.chatIsListeningReceiver$.next({
            chat_id: chatId,
            listening,
        });
    }

    private getIsListening(chatId: string): boolean {
        return this.isListeningFromChatId.get(chatId) ?? true;
    }

    private createChatMessage(
        chatId: string,
        content: string,
        isUser: boolean,
    ): Observable<any> {
        return this.apiService
            .post(`${UrlConstants.CHAT}/${chatId}/messages`, {content, isUser})
            .pipe(
                tap((chatMessage) => {
                    this.lastChatMessageId = chatMessage.messageId;
                    this.chatMessageReceiver$.next({
                        chat_id: chatId,
                        message_id: chatMessage.messageId,
                        timestamp: chatMessage.timestamp,
                        is_user: chatMessage.isUser,
                        content: chatMessage.content,
                    });
                }),
            );
    }

    private updateMessage(
        chatId: string,
        content: string,
        isUser: boolean,
    ): Observable<any> {
        return this.apiService
            .put(
                `${UrlConstants.CHAT}/${chatId}/messages/${this.lastChatMessageId}`,
                {content, isUser},
            )
            .pipe(
                tap((chatMessage) => {
                    this.chatMessageReceiver$.next({
                        chat_id: chatId,
                        message_id: this.lastChatMessageId,
                        timestamp: chatMessage.timestamp,
                        is_user: chatMessage.isUser,
                        content: chatMessage.content,
                    });
                }),
            );
    }

    private voiceAssistantState: VoiceAssistantState = {
        turned_on: false,
        chat_id: "",
    };
    private solidStateRelayState: SolidStateRelayState = {
        turned_on: false,
    };
    uuidCounter: number = 0;
    userMessageTimeout: any;
    vaMessageTimeout: any;
    lastChatMessageId: string = "";

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
    chatIsListeningReceiver$: Subject<ChatIsListening> =
        new Subject<ChatIsListening>();
    chatMessageReceiver$: Subject<ChatMessage> = new Subject<ChatMessage>();
    solidStateRelayStateReceiver$: BehaviorSubject<any> =
        new BehaviorSubject<any>({
            turned_on: false,
        });
    cameraTimer: any;

    private motorNames = motors.map((motor) => motor.motorName);

    private isListeningFromChatId: Map<string, boolean> = new Map();

    constructor(private apiService: ApiService) {
        let currentToggle: boolean = true;
        setInterval(() => {
            currentToggle = !currentToggle;
            for (const motorName of this.motorNames) {
                const current = currentToggle ? 400 : 200;
                this.currentReceiver$.next({
                    level: "arraybuffer",
                    name: motorName,
                    hardware_id: "",
                    values: [{key: motorName, value: current.toString()}],
                });
            }
        }, 1000);
    }

    applyJointTrajectory(
        jointTrajectory: JointTrajectoryMessage,
    ): Observable<void> {
        console.info(JSON.stringify({joint_trajectory: jointTrajectory}));
        this.jointTrajectoryReceiver$.next(structuredClone(jointTrajectory));
        return of(undefined);
    }

    checkTokenExists(): Observable<ExistTokenResponse> {
        return new BehaviorSubject({token_exists: true, token_active: true});
    }

    deleteTokenMessage() {
        return;
    }

    encryptToken(token: string, password: string): Observable<boolean> {
        console.info(JSON.stringify({token: token, password: password}));
        return new BehaviorSubject(true);
    }

    decryptToken(password: string): Observable<boolean> {
        console.info(JSON.stringify({password: password}));
        return new BehaviorSubject(true);
    }

    getChatIsListening(chatId: string): Observable<boolean> {
        return new BehaviorSubject(this.getIsListening(chatId));
    }

    sendChatMessage(chatId: string, content: string): Observable<void> {
        console.info(JSON.stringify({chat_id: chatId, content: content}));
        const listening = this.getIsListening(chatId);
        if (!listening) return throwError(() => "not listening");
        this.createChatMessage(chatId, content, true).subscribe();
        setTimeout(() => {
            this.createChatMessage(
                chatId,
                `this is the response to your input "${content}".`,
                false,
            ).subscribe((_) => {
                this.setIsListening(chatId, true);
            });
        }, 2000);
        if (content.toLocaleLowerCase() == "update") {
            setTimeout(async () => {
                await this.sleep(1500);
                this.updateMessage(
                    chatId,
                    `this is the response to your input "${content}". Second line for "${content}".`,
                    false,
                ).subscribe((_) => {
                    this.setIsListening(chatId, true);
                });
            }, 2000);
        }
        return new BehaviorSubject<void>(undefined);
    }

    setVoiceAssistantState(
        voiceAssistantState: VoiceAssistantState,
    ): Observable<void> {
        console.info(JSON.stringify(voiceAssistantState));
        const chatId = voiceAssistantState.chat_id;
        if (!this.getIsListening(voiceAssistantState.chat_id)) {
            return throwError(() => "cannot set state if not listening");
        }
        this.setIsListening(chatId, false);
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
                    this.createChatMessage(
                        chatId,
                        "hello, pib!",
                        true,
                    ).subscribe();
                }, 500);
                this.vaMessageTimeout = setTimeout(() => {
                    this.createChatMessage(
                        chatId,
                        "hello, user!",
                        false,
                    ).subscribe((_) => this.setIsListening(chatId, true));
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

    setSolidStateRelayState(state: SolidStateRelayState): Observable<void> {
        console.info(JSON.stringify({state}));
        const subject = new ReplaySubject<void>();
        if (this.solidStateRelayState.turned_on == state.turned_on) {
            subject.error("could not apply state of solid state relay...");
        } else {
            subject.next();
            subject.complete();
            this.solidStateRelayState = structuredClone({
                turned_on: state.turned_on,
            });
        }
        this.solidStateRelayStateReceiver$.next(
            structuredClone(this.solidStateRelayState),
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
                    mpid: 0,
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
                    mpid: 0,
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

    applyMotorSettings(
        motorSettingsMessage: MotorSettingsMessage,
    ): Observable<MotorSettingsMessage> {
        console.info(JSON.stringify(motorSettingsMessage));
        const settingsDto = {
            name: motorSettingsMessage.motor_name,
            velocity: motorSettingsMessage.velocity,
            acceleration: motorSettingsMessage.acceleration,
            deceleration: motorSettingsMessage.deceleration,
            period: motorSettingsMessage.period,
            pulseWidthMin: motorSettingsMessage.pulse_width_min,
            pulseWidthMax: motorSettingsMessage.pulse_width_max,
            rotationRangeMin: motorSettingsMessage.rotation_range_min,
            rotationRangeMax: motorSettingsMessage.rotation_range_max,
            turnedOn: motorSettingsMessage.turned_on,
            visible: motorSettingsMessage.visible,
        };
        const subject = new Subject<MotorSettingsMessage>();
        this.apiService
            .put(
                `${UrlConstants.MOTOR}/${motorSettingsMessage.motor_name}/settings`,
                settingsDto,
            )
            .subscribe({
                next: (_) => {
                    this.motorSettingsReceiver$.next(
                        structuredClone(motorSettingsMessage),
                    );
                    subject.next(structuredClone(motorSettingsMessage));
                },
                error: (_) =>
                    subject.error(
                        new MotorSettingsError(motorSettingsMessage, false),
                    ),
            });
        return subject;
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

    publishProgramInput(input: string, mpid: number) {
        console.info(JSON.stringify({input, mpid}));
    }

    sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
