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
import {ActivatedRoute, Params, RouterLink} from "@angular/router";
import {firstValueFrom, Subscription} from "rxjs";
import {ChatService} from "src/app/shared/services/chat.service";
import {TokenService} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {Chat} from "src/app/shared/types/chat.class";
import {extractText, toDeepChat} from "src/app/shared/util/deep-chat-mapper";
import "deep-chat";

@Component({
    selector: "app-chat-window-deep-chat",
    templateUrl: "./chat-window-deep-chat.component.html",
    styleUrls: ["./chat-window-deep-chat.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatWindowDeepChatComponent
    implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild("deepChat") deepChatRef!: ElementRef<any>;

    chat?: Chat;
    currentChatId: string | undefined;
    personalityName: string | undefined;

    private pendingSignals?: {onResponse: (response: unknown) => void};
    private lastStreamedMessageId: string | undefined;
    /** Timestamp of the latest user submit, used to measure TTFT. */
    private submitClickMs: number | undefined;

    private routeParamsSubscription?: Subscription;
    private chatMessagesSubscription?: Subscription;
    private tokenStatusSubscription?: Subscription;

    readonly USER_ICON =
        "../../../../assets/voice-assistant-svgs/chat/user.svg";
    readonly VA_ICON =
        "../../../../assets/voice-assistant-svgs/chat/pib-icon-speaking.png";

    constructor(
        private readonly chatService: ChatService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly route: ActivatedRoute,
        private readonly tokenService: TokenService,
    ) {}

    ngOnInit(): void {
        this.routeParamsSubscription = this.route.params.subscribe(
            (params: Params) => {
                this.chatMessagesSubscription?.unsubscribe();

                const chatId = params["chatUuid"];
                this.currentChatId = chatId;
                this.lastStreamedMessageId = undefined;
                this.pendingSignals = undefined;
                this.submitClickMs = undefined;
                if (!chatId) return;

                this.chat = this.chatService.getChat(chatId);
                if (this.chat) {
                    this.personalityName =
                        this.voiceAssistantService.getPersonality(
                            this.chat.personalityId,
                        )?.name;
                }

                this.applyNames();
                this.subscribeToChatMessages(chatId);
            },
        );
    }

    ngAfterViewInit(): void {
        const el = this.deepChatRef?.nativeElement;
        if (!el) return;

        this.applyStyles(el);
        this.wireConnect(el);
        this.wireLoadHistory(el);
        this.wireValidateInput(el);
        this.wireTokenStatus(el);
        this.applyNames(el);

        if (this.currentChatId) {
            this.subscribeToChatMessages(this.currentChatId);
        }
    }

    ngOnDestroy(): void {
        this.routeParamsSubscription?.unsubscribe();
        this.chatMessagesSubscription?.unsubscribe();
        this.tokenStatusSubscription?.unsubscribe();
    }

    private wireConnect(el: any): void {
        el.connect = {
            handler: (body: any, signals: any) => {
                const text = extractText(body);
                const chatId = this.currentChatId!;
                this.submitClickMs = performance.now();
                console.log(
                    `[PERF_TRACE_UI] SUBMIT_CLICK chatId=${chatId} t=${this.submitClickMs.toFixed(3)}ms`,
                );
                this.pendingSignals = signals;
                this.chatService.sendChatMessage(chatId, text).subscribe({
                    error: (err) => {
                        signals.onResponse({error: String(err)});
                        this.pendingSignals = undefined;
                        this.submitClickMs = undefined;
                    },
                });
            },
        };
    }

    private wireLoadHistory(el: any): void {
        el.loadHistory = () => {
            const chatId = this.currentChatId!;
            return firstValueFrom(
                this.chatService.getMessagesByChatId(chatId),
            ).then((msgs) =>
                this.chatService.filterMessageUpdates(msgs).map(toDeepChat),
            );
        };
    }

    private wireValidateInput(el: any): void {
        el.validateInput = (text?: string) => (text?.trim().length ?? 0) > 2;
    }

    private wireTokenStatus(el: any): void {
        this.tokenStatusSubscription?.unsubscribe();
        this.tokenStatusSubscription = this.tokenService.tokenStatus$.subscribe(
            ({tokenExists, tokenActive}) => {
                const enabled = tokenExists && tokenActive;
                el.textInput = {
                    disabled: !enabled,
                    placeholder: {
                        text: enabled
                            ? "Enter a message"
                            : "Enable SmartConnect to start the Voice-Assistant",
                    },
                };
                if (typeof el.disableSubmitButton === "function") {
                    el.disableSubmitButton(!enabled);
                }
            },
        );
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
        target.names = {ai: {text: this.personalityName}};
    }
}
