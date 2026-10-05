import {Injectable} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {
    LedRingMode,
    MicrophoneArrayService,
} from "src/app/system/microphone-array/microphone-array.service";
import {DEGRADED_MODE} from "src/app/system/speech/key-store-session";
import {KeyStoreSessionService} from "src/app/system/speech/key-store-session.service";
import {Chat} from "../types/chat.class";
import {VoiceAssistant} from "../types/voice-assistant";
import {AssistantModel} from "../types/assistantModel";
import {
    VisibleConversation,
    livePathUnavailable,
    visibleConversation,
    voiceHolderName,
} from "../types/visible-state";
import {ChatService} from "./chat.service";
import {RosService} from "./ros-service/ros.service";
import {VoiceAssistantService} from "./voice-assistant.service";

const IDLE_INPUT = {
    voiceTurnedOn: false,
    listening: false,
    assistantSpeaking: false,
    holderName: null,
    keyStoreDegraded: false,
    liveUnavailable: false,
};

@Injectable({
    providedIn: "root",
})
export class VisibleStateService {
    snapshot: VisibleConversation = visibleConversation(IDLE_INPUT);
    readonly snapshot$ = new BehaviorSubject<VisibleConversation>(
        this.snapshot,
    );

    private voiceTurnedOn = false;
    private voiceChatId = "";
    private readonly listeningByChat = new Map<string, boolean>();
    private assistantSpeaking = false;
    private chats: Chat[] = [];
    private personalities: VoiceAssistant[] = [];
    private models: AssistantModel[] = [];
    private seededChatId = "";
    private desiredLed: LedRingMode | null = null;
    private savedLed: LedRingMode | null = null;
    private appliedLed: LedRingMode | null = null;
    private ledLive = false;
    private ledWatchStarted = false;
    private readingLed = false;
    private publishedExpression: string | null = null;
    private publishedText: string | null = null;
    private readonly subscriptions = new Subscription();

    constructor(
        private readonly ros: RosService,
        private readonly voiceAssistant: VoiceAssistantService,
        private readonly chatsService: ChatService,
        private readonly keyStore: KeyStoreSessionService,
        private readonly microphone: MicrophoneArrayService,
    ) {
        this.subscriptions.add(
            this.voiceAssistant.voiceAssistantStateObservable.subscribe(
                (state) => {
                    const chatChanged = state.chatId !== this.voiceChatId;
                    this.voiceTurnedOn = state.turnedOn;
                    this.voiceChatId = state.chatId;
                    if (chatChanged || !state.turnedOn) {
                        this.assistantSpeaking = false;
                    }
                    this.seedListening(state.chatId, state.turnedOn);
                    this.recompute();
                },
            ),
        );
        this.subscriptions.add(
            this.ros.chatIsListeningReceiver$.subscribe((message) => {
                const previous = this.listeningByChat.get(message.chat_id);
                this.listeningByChat.set(message.chat_id, message.listening);
                if (
                    message.chat_id === this.voiceChatId &&
                    message.listening &&
                    previous === false
                ) {
                    this.assistantSpeaking = false;
                }
                this.recompute();
            }),
        );
        this.subscriptions.add(
            this.ros.chatMessageReceiver$.subscribe((message) => {
                if (
                    message.chat_id !== this.voiceChatId ||
                    !this.voiceTurnedOn
                ) {
                    return;
                }
                this.assistantSpeaking = !message.is_user;
                this.recompute();
            }),
        );
        this.chats = this.chatsService.chatSubject.getValue();
        this.subscriptions.add(
            this.chatsService.chatSubject.subscribe((chats) => {
                this.chats = chats;
                this.recompute();
            }),
        );
        this.personalities =
            this.voiceAssistant.personalitiesSubject.getValue();
        this.subscriptions.add(
            this.voiceAssistant.personalitiesSubject.subscribe(
                (personalities) => {
                    this.personalities = personalities;
                    this.recompute();
                },
            ),
        );
        this.models = this.voiceAssistant.assistantModelsSubject.getValue();
        this.subscriptions.add(
            this.voiceAssistant.assistantModelsSubject.subscribe((models) => {
                this.models = models;
                this.recompute();
            }),
        );
        this.subscriptions.add(
            this.keyStore.changes.subscribe(() => this.recompute()),
        );
        this.recompute();
    }

    private seedListening(chatId: string, turnedOn: boolean): void {
        if (!turnedOn || chatId === "" || this.listeningByChat.has(chatId)) {
            return;
        }
        if (this.seededChatId === chatId) {
            return;
        }
        this.seededChatId = chatId;
        this.subscriptions.add(
            this.ros.getChatIsListening(chatId).subscribe({
                next: (listening) => {
                    if (!this.listeningByChat.has(chatId)) {
                        this.listeningByChat.set(chatId, listening);
                        this.recompute();
                    }
                },
                error: () => undefined,
            }),
        );
    }

    private recompute(): void {
        const holderName = this.voiceTurnedOn
            ? voiceHolderName(this.voiceChatId, this.chats, this.personalities)
            : null;
        const personality = this.personalityForChat(this.voiceChatId);
        const next = visibleConversation({
            voiceTurnedOn: this.voiceTurnedOn,
            listening: this.listeningFor(this.voiceChatId),
            assistantSpeaking: this.assistantSpeaking,
            holderName,
            keyStoreDegraded: this.keyStore.mode === DEGRADED_MODE,
            liveUnavailable: livePathUnavailable(personality, this.models),
        });
        this.snapshot = next;
        this.snapshot$.next(next);
        this.publishFace(next);
        this.syncLed(next.ledMode);
    }

    private listeningFor(chatId: string): boolean {
        if (chatId === "" || !this.listeningByChat.has(chatId)) {
            return true;
        }
        return this.listeningByChat.get(chatId) === true;
    }

    private personalityForChat(chatId: string): VoiceAssistant | null {
        const chat = this.chats.find((item) => item.chatId === chatId);
        if (chat == null) {
            return null;
        }
        return (
            this.personalities.find(
                (item) => item.personalityId === chat.personalityId,
            ) ?? null
        );
    }

    private publishFace(state: VisibleConversation): void {
        if (
            state.expression != null &&
            state.expression !== this.publishedExpression
        ) {
            this.publishedExpression = state.expression;
            this.ros.publishExpression(state.expression);
        }
        if (state.expression == null) {
            this.publishedExpression = null;
        }
        if (
            state.displayText === "" ||
            state.displayText === this.publishedText
        ) {
            if (state.displayText === "") {
                this.publishedText = null;
            }
            return;
        }
        this.publishedText = state.displayText;
        this.ros.publishDisplayText(state.displayText);
    }

    private syncLed(mode: LedRingMode | null): void {
        const wanted = mode;
        if (
            wanted == null &&
            this.appliedLed == null &&
            this.savedLed == null
        ) {
            this.desiredLed = null;
            return;
        }
        this.desiredLed = wanted;
        this.ensureLedWatch();
        this.flushLed();
    }

    private ensureLedWatch(): void {
        if (this.ledWatchStarted) {
            return;
        }
        this.ledWatchStarted = true;
        this.microphone.connect();
        this.subscriptions.add(
            this.microphone.getTelemetry().subscribe((telemetry) => {
                this.ledLive = telemetry.connectionState === "live";
                if (this.ledLive) {
                    this.flushLed();
                }
            }),
        );
    }

    private flushLed(): void {
        if (!this.ledLive) {
            return;
        }
        const wanted = this.desiredLed;
        if (wanted == null) {
            this.restoreLed();
            return;
        }
        if (this.appliedLed === wanted) {
            return;
        }
        if (this.savedLed == null) {
            if (this.readingLed) {
                return;
            }
            this.readingLed = true;
            this.subscriptions.add(
                this.microphone.getTuning().subscribe({
                    next: (tuning) => {
                        this.readingLed = false;
                        this.savedLed = tuning.ledMode ?? "off";
                        if (this.desiredLed == null) {
                            this.restoreLed();
                            return;
                        }
                        if (this.savedLed === this.desiredLed) {
                            this.appliedLed = this.desiredLed;
                            return;
                        }
                        this.writeLed(this.desiredLed);
                    },
                    error: () => {
                        this.readingLed = false;
                    },
                }),
            );
            return;
        }
        this.writeLed(wanted);
    }

    private writeLed(mode: LedRingMode): void {
        this.subscriptions.add(
            this.microphone.updateTuning({led_ring: {mode}}).subscribe({
                next: () => {
                    if (this.desiredLed == null) {
                        this.appliedLed = null;
                        return;
                    }
                    this.appliedLed = mode;
                },
                error: () => undefined,
            }),
        );
    }

    private restoreLed(): void {
        if (this.savedLed == null || this.appliedLed == null) {
            this.appliedLed = null;
            return;
        }
        if (this.appliedLed === this.savedLed) {
            this.appliedLed = null;
            return;
        }
        const restore = this.savedLed;
        this.appliedLed = null;
        this.writeLed(restore);
    }
}
