import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from "@angular/core";
import {HttpErrorResponse} from "@angular/common/http";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Subscription, switchMap} from "rxjs";
import {ChatService} from "src/app/shared/services/chat.service";
import {
    TokenService,
    normalizeTokenStatus,
} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {imageAttachments} from "src/app/shared/types/chat-message-meta";
import {Chat, ChatDto} from "src/app/shared/types/chat.class";
import {extractText, toDeepChat} from "src/app/shared/util/deep-chat-mapper";
import {
    ProviderSelectionRow,
    TokenProbeState,
    DeepChatComposerState,
    chatMessageLengthRefusal,
    chatTransportUnavailableText,
    effectiveCloudTokenStored,
    resolveDeepChatComposer,
} from "src/app/shared/types/provider-registry";
import {degradedChatReply} from "src/app/system/keys/key-store-session";
import {KeyStoreService} from "src/app/system/keys/key-store.service";
import {KeyStoreSessionService} from "src/app/system/keys/key-store-session.service";
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";
import {
    RoutedTurn,
    routeTurn,
    transportRequest,
} from "src/app/shared/types/channel-router";
import {typedTextJoinsLive} from "src/app/shared/types/live-interaction";
import {VoiceAssistantState} from "src/app/shared/types/voice-assistant-state";
import "deep-chat";

@Component({
    selector: "app-chat-window-deep-chat",
    templateUrl: "./chat-window-deep-chat.component.html",
    styleUrls: ["./chat-window-deep-chat.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatWindowDeepChatComponent
    implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild("deepChat") deepChatRef!: ElementRef<any>;

    chat?: Chat;
    currentChatId: string | undefined;
    /** Set only when the window has no way to show a message (no deep-chat element yet). */
    newChatError = "";
    personalityName: string | undefined;

    private probeCloudTokenStored = false;
    private credentialRefs: string[] = [];
    private tokenProbe: TokenProbeState = "unknown";
    /** Same flag the composer used to treat as SmartConnect: stored and active. */
    private smartConnectActive = false;
    /**
     * Keys page reads `encryptKeyStorage` from key-store status. False means
     * encryption is deactivated and typing does not need SmartConnect.
     */
    private keyStorageEncryptionOff = false;
    private assistantModels: ProviderSelectionRow[] = [];
    private composerState: DeepChatComposerState = {
        inputEnabled: false,
        placeholder: "",
        turnRefusal: null,
        characterLimit: 0,
    };
    private pendingSignals?: {onResponse: (response: unknown) => void};
    private lastStreamedMessageId: string | undefined;
    private chatHistorySubscription?: Subscription;
    /** Chat whose history subscription is live - keeps init from reading twice. */
    private historySyncedChatId: string | undefined;
    /** Debounce of the stored-message lookup that brings the captured pictures. */
    private imageRefreshTimer: ReturnType<typeof setTimeout> | undefined;
    private readonly imageRefreshDelayMs = 700;
    /** Timestamp of the latest user submit, used to measure TTFT. */
    private submitClickMs: number | undefined;

    private routeParamsSubscription?: Subscription;
    private chatMessagesSubscription?: Subscription;
    private tokenStatusSubscription?: Subscription;
    private keyStoreStatusSubscription?: Subscription;
    private keyStoreSessionSubscription?: Subscription;
    private assistantModelsSubscription?: Subscription;
    private voiceStateSubscription?: Subscription;
    private voiceState: VoiceAssistantState = {turnedOn: false, chatId: ""};
    /** Undefined until the first key-store read; then unknown on failure. */
    private readonly sendChatMessageSubscriptions = new Subscription();
    private previousRouteChatId: string | undefined;

    readonly USER_ICON =
        "../../../../assets/voice-assistant-svgs/chat/user.svg";
    readonly VA_ICON =
        "../../../../assets/voice-assistant-svgs/chat/pib-icon-speaking.png";
    /** deep-chat's own label for the human side of the conversation. */
    readonly USER_NAME_LABEL = "User";
    /**
     * Both partner names sit on this chat's dark blue background (#041939) and
     * deep-chat draws them black by default, which cannot be read. The colour is
     * set through the name style, because the elements live in deep-chat's
     * shadow root and no outer stylesheet reaches them.
     */
    readonly PARTNER_NAME_STYLE = {color: "#fff"};

    constructor(
        private readonly chatService: ChatService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly tokenService: TokenService,
        private readonly keyStore: KeyStoreService,
        private readonly keyStoreSession: KeyStoreSessionService,
        private readonly channelCapability: ChannelCapabilityService,
    ) {}

    ngOnInit(): void {
        this.voiceStateSubscription =
            this.voiceAssistantService.voiceAssistantStateObservable?.subscribe(
                (state) => {
                    this.voiceState = state;
                },
            );
        this.routeParamsSubscription = this.route.params.subscribe(
            (params: Params) => {
                this.chatMessagesSubscription?.unsubscribe();
                this.chatHistorySubscription?.unsubscribe();

                const chatId = params["chatUuid"];
                if (chatId && chatId !== this.previousRouteChatId) {
                    this.chatService.refreshChatMessages(chatId);
                }
                this.previousRouteChatId = chatId;
                this.currentChatId = chatId;
                this.lastStreamedMessageId = undefined;
                this.pendingSignals = undefined;
                this.submitClickMs = undefined;
                if (!chatId) {
                    this.chat = undefined;
                    const personalityId = this.personalityIdFromRoute();
                    if (personalityId) {
                        this.personalityName =
                            this.voiceAssistantService.getPersonality(
                                personalityId,
                            )?.name;
                    }
                    this.applyNames();
                    this.refreshComposer();
                    return;
                }

                this.chat = this.chatService.getChat(chatId);
                if (this.chat) {
                    this.personalityName =
                        this.voiceAssistantService.getPersonality(
                            this.chat.personalityId,
                        )?.name;
                }

                this.applyNames();
                this.syncHistoryFromBuffer(this.currentChatId);
                this.subscribeToChatMessages(chatId);
                this.refreshComposer();
            },
        );
    }

    ngAfterViewInit(): void {
        const el = this.deepChatRef?.nativeElement;
        if (!el) return;

        this.applyStyles(el);
        this.wireConnect(el);
        this.wireValidateInput(el);
        this.wireTokenStatus(el);
        this.wireKeyStoreStatus(el);
        this.wireAssistantModels(el);
        this.wireKeyStoreSession(el);
        this.applyNames(el);

        this.syncHistoryFromBuffer(this.currentChatId, el);
        if (this.currentChatId) {
            this.subscribeToChatMessages(this.currentChatId);
        }
    }

    ngOnDestroy(): void {
        this.routeParamsSubscription?.unsubscribe();
        this.chatMessagesSubscription?.unsubscribe();
        this.tokenStatusSubscription?.unsubscribe();
        this.keyStoreStatusSubscription?.unsubscribe();
        this.keyStoreSessionSubscription?.unsubscribe();
        this.assistantModelsSubscription?.unsubscribe();
        this.voiceStateSubscription?.unsubscribe();
        this.sendChatMessageSubscriptions.unsubscribe();
        if (this.imageRefreshTimer !== undefined) {
            clearTimeout(this.imageRefreshTimer);
            this.imageRefreshTimer = undefined;
        }
    }

    private wireConnect(el: any): void {
        el.connect = {
            handler: (body: any, signals: any) => {
                const text = extractText(body);
                if (!this.keyStoreSession.chatsAvailable) {
                    signals.onResponse({
                        role: "ai",
                        text: degradedChatReply(this.personalityName),
                    });
                    return;
                }
                if (!this.composerState.inputEnabled) {
                    const refusal = this.composerTurnRefusal();
                    signals.onResponse({
                        text: refusal ?? this.composerState.placeholder,
                    });
                    return;
                }
                const lengthRefusal = chatMessageLengthRefusal(text);
                if (lengthRefusal != null) {
                    signals.onResponse({text: lengthRefusal});
                    return;
                }
                const joining = this.typedLineJoinsOpenLive(text);
                const messageText = joining ? text.trim() : text;
                const chatId = this.currentChatId;
                if (!chatId) {
                    this.beginTurnWithoutChat(messageText, joining, signals);
                    return;
                }
                this.dispatchTurn(chatId, messageText, joining, signals);
            },
        };
    }

    /**
     * Drives the widget's history property from the buffered stream.
     *
     * deep-chat 2.5.1 accepts a property assignment after it has rendered (2.5.0
     * did not - that is why PR-2094 was abandoned), so no `loadHistory` callback and
     * no addMessage loop is needed. The streaming handler remains the only writer for
     * new messages, which removes the duplicated-bubble risk structurally.
     */
    private syncHistoryFromBuffer(chatId: string | undefined, el?: any): void {
        const target = el ?? this.deepChatRef?.nativeElement;
        if (!target) return;

        if (chatId && chatId === this.historySyncedChatId) return;

        this.chatHistorySubscription?.unsubscribe();
        this.historySyncedChatId = undefined;

        if (!chatId) {
            target.history = [];
            return;
        }

        this.chatHistorySubscription = this.chatService
            .getChatMessagesForHistory(chatId)
            .subscribe((msgs) => {
                const history = this.chatService
                    .filterMessageUpdates(msgs)
                    .map(toDeepChat);
                const newest = msgs[msgs.length - 1];
                if (newest && !this.pendingSignals) {
                    // Already on screen through the property: the same message
                    // arriving from the stream takes the overwrite path in
                    // handleStreamedMessages instead of appending a second bubble.
                    // During a live turn the stream owns the newest message, so the
                    // marker stays where the turn put it.
                    this.lastStreamedMessageId = newest.messageId;
                }
                target.history = history;
            });
        this.historySyncedChatId = chatId;
    }

    /** A chat that could not be created has no bubble of its own; say it in the chat. */
    private showNewChatError(message: string): void {
        const el = this.deepChatRef?.nativeElement;
        if (el && typeof el.addMessage === "function") {
            el.addMessage({role: "ai", text: message});
            return;
        }
        this.newChatError = message;
    }

    /**
     * deep-chat clears its input when the user submits and exposes no setter, so
     * the text is written back into the shadow input (PR-2046).
     */
    private restoreComposerText(el: any, text: string): void {
        const root = el?.shadowRoot;
        const input =
            root?.querySelector?.("textarea") ??
            root?.querySelector?.("input[type=text]") ??
            root?.querySelector?.('[contenteditable="true"]');
        if (!input) {
            return;
        }
        if (input.isContentEditable) {
            input.textContent = text;
        } else {
            input.value = text;
        }
        input.dispatchEvent(
            new InputEvent("input", {
                bubbles: true,
                composed: true,
                inputType: "insertText",
                data: text,
            }),
        );
    }

    private beginTurnWithoutChat(
        messageText: string,
        joining: boolean,
        signals: any,
    ): void {
        const personalityId = this.personalityIdFromRoute();
        if (!personalityId) {
            signals.onResponse({
                text: "Could not create chat: personality not found.",
            });
            this.restoreComposerText(
                this.deepChatRef?.nativeElement,
                messageText,
            );
            return;
        }
        const topic = messageText.trim().slice(0, 255) || "New chat";
        this.submitClickMs = performance.now();
        console.log(
            `[PERF_TRACE_UI] SUBMIT_CLICK chatId=undefined t=${this.submitClickMs.toFixed(
                3,
            )}ms`,
        );
        this.pendingSignals = joining ? undefined : signals;
        if (joining) {
            signals.onClose();
        }
        this.sendChatMessageSubscriptions.add(
            this.chatService
                .createChat(new ChatDto(topic, personalityId))
                .pipe(
                    switchMap((chat) => {
                        this.adoptCreatedChat(chat);
                        const request = transportRequest(
                            chat.chatId,
                            this.turnForMessage(messageText),
                        );
                        return this.chatService.sendChatMessage(
                            request.chat_id,
                            request.content,
                        );
                    }),
                )
                .subscribe({
                    error: (err) => {
                        signals.onResponse({
                            text: chatCreateErrorMessage(err),
                        });
                        this.restoreComposerText(
                            this.deepChatRef?.nativeElement,
                            messageText,
                        );
                        this.pendingSignals = undefined;
                        this.submitClickMs = undefined;
                    },
                }),
        );
    }

    private dispatchTurn(
        chatId: string,
        messageText: string,
        joining: boolean,
        signals: any,
    ): void {
        this.submitClickMs = performance.now();
        console.log(
            `[PERF_TRACE_UI] SUBMIT_CLICK chatId=${chatId} t=${this.submitClickMs.toFixed(
                3,
            )}ms`,
        );
        this.pendingSignals = joining ? undefined : signals;
        if (joining) {
            signals.onClose();
        }
        const request = transportRequest(
            chatId,
            this.turnForMessage(messageText),
        );
        this.sendChatMessageSubscriptions.add(
            this.chatService
                .sendChatMessage(request.chat_id, request.content)
                .subscribe({
                    error: (err) => {
                        const unavailable = chatTransportUnavailableText(err);
                        if (unavailable != null) {
                            signals.onResponse({text: unavailable});
                        } else {
                            signals.onResponse({error: String(err)});
                        }
                        this.pendingSignals = undefined;
                        this.submitClickMs = undefined;
                    },
                }),
        );
    }

    private adoptCreatedChat(chat: Chat): void {
        this.chatService.refreshChatMessages(chat.chatId);
        this.currentChatId = chat.chatId;
        this.chat = chat;
        this.personalityName = this.voiceAssistantService.getPersonality(
            chat.personalityId,
        )?.name;
        this.applyNames();
        this.subscribeToChatMessages(chat.chatId);
        const parent = this.route.parent;
        if (parent) {
            void this.router.navigate([chat.chatId], {relativeTo: parent});
        }
    }

    private personalityIdFromRoute(): string | undefined {
        let route: ActivatedRoute | null = this.route;
        while (route) {
            const personalityUuid = route.snapshot?.params?.["personalityUuid"];
            if (personalityUuid) {
                return personalityUuid;
            }
            route = route.parent;
        }
        return this.chat?.personalityId;
    }

    private wireValidateInput(el: any): void {
        el.validateInput = (text?: string) => (text?.trim().length ?? 0) >= 1;
    }

    private wireTokenStatus(el: any): void {
        this.tokenStatusSubscription?.unsubscribe();
        this.tokenStatusSubscription = this.tokenService.tokenStatus$.subscribe(
            (status) => {
                const resolved = normalizeTokenStatus(status);
                this.probeCloudTokenStored = resolved.tokenExists === true;
                this.tokenProbe = resolved.service;
                this.smartConnectActive =
                    resolved.tokenExists === true &&
                    resolved.tokenActive === true;
                this.refreshComposer(el);
            },
        );
    }

    /** Same status read as the Keys page: GET /api/system/key-store. */
    private wireKeyStoreStatus(el: any): void {
        this.keyStoreStatusSubscription?.unsubscribe();
        this.keyStoreStatusSubscription = this.keyStore.status().subscribe({
            next: (status) => {
                this.keyStorageEncryptionOff =
                    status.encryptKeyStorage === false;
                this.credentialRefs = status.credentialRefs ?? [];
                this.refreshComposer(el);
            },
            error: () => {
                this.keyStorageEncryptionOff = false;
                this.refreshComposer(el);
            },
        });
    }

    private wireAssistantModels(el: any): void {
        this.assistantModelsSubscription?.unsubscribe();
        const subject = this.voiceAssistantService.assistantModelsSubject;
        if (subject == null) {
            return;
        }
        this.assistantModels = subject.getValue() ?? [];
        this.assistantModelsSubscription = subject.subscribe((models) => {
            this.assistantModels = models ?? [];
            this.refreshComposer(el);
        });
        this.refreshComposer(el);
    }

    private wireKeyStoreSession(el: any): void {
        this.keyStoreSessionSubscription?.unsubscribe();
        this.keyStoreSessionSubscription =
            this.keyStoreSession.changes.subscribe(() => {
                this.refreshComposer(el);
            });
        this.refreshComposer(el);
    }

    private refreshComposer(el?: any): void {
        const target = el ?? this.deepChatRef?.nativeElement;
        const liveModels =
            this.voiceAssistantService.assistantModelsSubject?.getValue();
        if (liveModels != null) {
            this.assistantModels = liveModels;
        }
        const personality = this.personalityForTurn();
        this.composerState = resolveDeepChatComposer({
            smartConnectActive: this.smartConnectActive,
            keyStorageEncryptionOff: this.keyStorageEncryptionOff,
            chatsAvailable: this.keyStoreSession.chatsAvailable,
            providerRef: personality?.providerRef,
            models: this.assistantModels,
            cloudTokenStored: effectiveCloudTokenStored(
                this.probeCloudTokenStored,
                this.assistantModels,
                this.credentialRefs,
            ),
            needsNewModel: personality?.needsNewModel === true,
            tokenProbe: this.tokenProbe,
        });
        if (target != null) {
            this.applyTextInput(target);
        }
    }

    private applyTextInput(el: any): void {
        const enabled = this.composerState.inputEnabled;
        el.textInput = {
            disabled: !enabled,
            placeholder: {text: this.composerState.placeholder},
            characterLimit: this.composerState.characterLimit,
        };
        if (typeof el.disableSubmitButton === "function") {
            el.disableSubmitButton(!enabled);
        }
    }

    /**
     * Direct turns carry the personality identity as the system prompt.
     * MEMORY stays on Smart. The ROS request stays chat id plus user text.
     */
    turnForMessage(content: string): RoutedTurn {
        const personality = this.personalityForTurn();
        return routeTurn({
            channel: personality?.channel,
            smartChatsEnabled: this.channelCapability.smartChatsEnabled,
            soul: personality?.description,
            memory: null,
            content,
        });
    }

    private personalityForTurn() {
        const personalityId =
            this.chat?.personalityId ?? this.personalityIdFromRoute();
        if (personalityId == null) {
            return undefined;
        }
        return this.voiceAssistantService.getPersonality(personalityId);
    }

    /**
     * The open live session of this chat. Choosing the live model is what
     * makes the session live; a typed line joins it instead of starting
     * a second turn.
     */
    private typedLineJoinsOpenLive(text: string): boolean {
        const personality = this.personalityForTurn();
        return typedTextJoinsLive({
            liveOpen: this.voiceState.turnedOn && personality?.live === true,
            liveChatId: this.voiceState.chatId,
            messageChatId: this.currentChatId,
            text,
        }).join;
    }

    private composerTurnRefusal(): string | null {
        return this.composerState.turnRefusal;
    }

    private subscribeToChatMessages(chatId: string): void {
        const el = this.deepChatRef?.nativeElement;
        if (!el) return;

        this.chatMessagesSubscription?.unsubscribe();
        this.chatMessagesSubscription = this.chatService
            .getChatMessagesObservable(chatId)
            .subscribe((messages) => this.handleStreamedMessages(messages, el));
    }

    private handleStreamedMessages(messages: ChatMessage[], el: any): void {
        if (!messages?.length) return;

        const newest = messages[messages.length - 1];
        if (newest.isUser) return;

        const {messageId, content} = newest;

        if (this.pendingSignals && content) {
            this.logTtftIfPending();
            this.pendingSignals.onResponse({role: "ai", text: content});
            this.lastStreamedMessageId = messageId;
            this.pendingSignals = undefined;
        } else if (messageId === this.lastStreamedMessageId) {
            if (typeof el.addMessage === "function") {
                el.addMessage({
                    role: "ai",
                    text: content,
                    overwrite: true,
                });
            }
        } else {
            if (typeof el.addMessage === "function") {
                this.logTtftIfPending();
                el.addMessage({role: "ai", text: content});
            }
            this.lastStreamedMessageId = messageId;
        }

        // A picture a tool captured is written onto the message after the answer
        // was stored, and the live channel carries text only. Read that one
        // message back once the text stops arriving.
        this.scheduleImageRefresh(messageId, content, el);
    }

    /**
     * Ask for the stored message a moment after its last chunk and paint the
     * pictures a tool captured during that turn (PC-119).
     *
     * One request per turn: every chunk of a turn resets the timer, so a
     * streaming answer produces exactly one lookup after it has settled.
     */
    private scheduleImageRefresh(
        messageId: string,
        content: string,
        el: any,
    ): void {
        if (typeof el.addMessage !== "function") {
            return;
        }
        if (this.imageRefreshTimer !== undefined) {
            clearTimeout(this.imageRefreshTimer);
        }
        const chatId = this.currentChatId;
        this.imageRefreshTimer = setTimeout(() => {
            this.imageRefreshTimer = undefined;
            if (!chatId || messageId !== this.lastStreamedMessageId) {
                return;
            }
            this.chatService
                .getChatMessage(chatId, messageId)
                .subscribe((stored) => {
                    const attachments = imageAttachments(stored?.meta);
                    if (!attachments.length) {
                        return;
                    }
                    if (messageId !== this.lastStreamedMessageId) {
                        return;
                    }
                    el.addMessage({
                        role: "ai",
                        text: stored.content || content,
                        files: attachments,
                        overwrite: true,
                    });
                });
        }, this.imageRefreshDelayMs);
    }

    private logTtftIfPending(): void {
        if (this.submitClickMs === undefined) {
            return;
        }
        const ttftMs = performance.now() - this.submitClickMs;
        console.log(`[PERF_TRACE_UI] TTFT ${ttftMs.toFixed(3)}ms`);
        this.submitClickMs = undefined;
    }

    private applyStyles(el: any): void {
        // NOTE: the property is `chatStyle`, NOT `style` — `style` is a
        // read-only CSSStyleDeclaration on every HTMLElement, so assigning to
        // it would silently fail (or throw in strict mode).
        el.chatStyle = {
            border: "1px solid #ccc",
            backgroundColor: "#041939",
            height: "100%",
            width: "100%",
            fontSize: "16px",
        };

        el.messageStyles = {
            default: {
                shared: {
                    bubble: {
                        backgroundColor: "#344864",
                        color: "#fff",
                        borderRadius: "10px",
                    },
                },
            },
        };

        el.inputAreaStyle = {
            backgroundColor: "#344864",
            borderRadius: "10px",
            padding: "10px",
        };

        el.submitButtonStyles = {
            submit: {
                container: {
                    default: {
                        backgroundColor: "transparent",
                    },
                },
            },
            disabled: {
                container: {
                    default: {
                        opacity: "0.3",
                        cursor: "not-allowed",
                    },
                },
            },
        };

        el.avatars = {
            user: {src: this.USER_ICON},
            ai: {src: this.VA_ICON},
        };

        el.auxiliaryStyle = `
            code { color: #d3cccc; }
            blockquote { background-color: #344864; }
        `;
    }

    private applyNames(el?: any): void {
        const target = el ?? this.deepChatRef?.nativeElement;
        if (!target || !this.personalityName) return;
        target.names = {
            user: {
                text: this.USER_NAME_LABEL,
                style: this.PARTNER_NAME_STYLE,
            },
            ai: {
                text: this.personalityName,
                style: this.PARTNER_NAME_STYLE,
            },
        };
    }
}

function chatCreateErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status) {
        const detail =
            (err.error && (err.error.error ?? err.error.message)) ??
            err.statusText ??
            "request failed";
        return `Could not create chat (${err.status}): ${detail}`;
    }
    return `Could not create chat: ${
        err instanceof Error ? err.message : "request failed"
    }`;
}
