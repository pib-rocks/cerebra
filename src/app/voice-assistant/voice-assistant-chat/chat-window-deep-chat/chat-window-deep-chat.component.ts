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
import {
    extractText,
    toDeepChat,
} from "src/app/shared/util/deep-chat-mapper";
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

    private routeParamsSubscription?: Subscription;
    private chatMessagesSubscription?: Subscription;
    private tokenStatusSubscription?: Subscription;

    /** Stamped deep-chat submit control for Playwright is_enabled()/is_disabled(). */
    private stampedSubmitButton: Element | null = null;
    private smartConnectEnabled = false;
    private currentInputText = "";
    private e2eHooksObserver?: MutationObserver;
    private e2eHooksRetryTimeout?: ReturnType<typeof setTimeout>;

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
        this.wireOnInput(el);
        this.wireTokenStatus(el);
        this.applyNames(el);
        this.applyE2eHooks(el);

        if (this.currentChatId) {
            this.subscribeToChatMessages(this.currentChatId);
        }
    }

    ngOnDestroy(): void {
        this.routeParamsSubscription?.unsubscribe();
        this.chatMessagesSubscription?.unsubscribe();
        this.tokenStatusSubscription?.unsubscribe();
        this.teardownE2eHooksWatchers();
    }

    private wireConnect(el: any): void {
        el.connect = {
            handler: (body: any, signals: any) => {
                const text = extractText(body);
                const chatId = this.currentChatId!;
                this.pendingSignals = signals;
                this.chatService.sendChatMessage(chatId, text).subscribe({
                    error: (err) => {
                        signals.onResponse({error: String(err)});
                        this.pendingSignals = undefined;
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
        el.validateInput = (text?: string) =>
            (text?.trim().length ?? 0) > 2;
    }

    private wireOnInput(el: any): void {
        el.onInput = (body?: {content?: {text?: string}}) => {
            this.currentInputText = body?.content?.text ?? "";
            this.syncSubmitButtonDisabled();
        };
    }

    private wireTokenStatus(el: any): void {
        this.tokenStatusSubscription?.unsubscribe();
        this.tokenStatusSubscription = this.tokenService.tokenStatus$.subscribe(
            ({tokenExists, tokenActive}) => {
                const enabled = tokenExists && tokenActive;
                this.smartConnectEnabled = enabled;
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
                this.syncSubmitButtonDisabled();
            },
        );
    }

    /**
     * Stamp legacy E2E hooks onto deep-chat's internal input/submit so
     * Playwright (#message-input / #chat-send-button) and Robot Framework
     * (data-test=TXT_Chat_Message / BTN_Chat_Send) keep working.
     *
     * deep-chat renders asynchronously (often inside shadow DOM); retry via
     * setTimeout + MutationObserver. Never throws.
     */
    private applyE2eHooks(el: any): void {
        try {
            if (this.tryStampE2eHooks(el)) {
                return;
            }

            // deep-chat exposes an official lifecycle hook that fires once the
            // component has rendered its shadow DOM. This is the reliable place
            // to stamp; the poll below is only a safety net.
            const previous = el.onComponentRender;
            el.onComponentRender = (ref: any) => {
                try {
                    if (typeof previous === "function") previous(ref);
                } catch {
                    // never let a foreign handler break ours
                }
                try {
                    this.tryStampE2eHooks(el);
                } catch {
                    // never throw
                }
            };

            // Safety net: deep-chat attaches its shadow root and renders
            // #text-input / #submit-icon asynchronously AFTER ngAfterViewInit.
            // A MutationObserver alone is not enough because at this point
            // `el.shadowRoot` is still null, so we would observe the wrong root
            // and never fire. Poll until the controls exist.
            let attempts = 0;
            const poll = () => {
                attempts += 1;
                try {
                    if (this.tryStampE2eHooks(el)) {
                        this.teardownE2eHooksWatchers();
                        return;
                    }
                } catch {
                    // never throw
                }
                if (attempts < 60) {
                    this.e2eHooksRetryTimeout = setTimeout(poll, 100);
                } else {
                    // Last resort: now that the shadow root has most likely been
                    // attached, watch it for late re-renders.
                    this.observeE2eHooks(el);
                }
            };
            this.e2eHooksRetryTimeout = setTimeout(poll, 50);
        } catch {
            // never throw
        }
    }

    private tryStampE2eHooks(el: any): boolean {
        try {
            const root: ParentNode = el.shadowRoot ?? el;

            const input =
                // deep-chat v2.5.0 renders a contenteditable div, NOT a textarea,
                // and it lives inside the component's shadow root.
                root.querySelector?.("#text-input") ??
                root.querySelector?.("[contenteditable=true]") ??
                root.querySelector?.("#chat-view textarea") ??
                root.querySelector?.("textarea") ??
                root.querySelector?.("input[type=text]");

            const button =
                root.querySelector?.("#submit-icon") ??
                root.querySelector?.(".input-button-svg") ??
                root.querySelector?.("button");

            if (input) {
                input.setAttribute("id", "message-input");
                input.setAttribute("data-test", "TXT_Chat_Message");
            }
            if (button) {
                button.setAttribute("id", "chat-send-button");
                button.setAttribute("data-test", "BTN_Chat_Send");
                this.stampedSubmitButton = button;
                this.syncSubmitButtonDisabled();
            }

            return !!(input && button);
        } catch {
            return false;
        }
    }

    private observeE2eHooks(el: any): void {
        try {
            const root: Node = el.shadowRoot ?? el;
            this.e2eHooksObserver?.disconnect();
            this.e2eHooksObserver = new MutationObserver(() => {
                try {
                    if (this.tryStampE2eHooks(el)) {
                        this.teardownE2eHooksWatchers();
                    }
                } catch {
                    // never throw
                }
            });
            this.e2eHooksObserver.observe(root, {
                childList: true,
                subtree: true,
            });
            // Bound the watcher so a never-ready deep-chat cannot leak.
            this.e2eHooksRetryTimeout = setTimeout(() => {
                this.teardownE2eHooksWatchers();
            }, 5000);
        } catch {
            // never throw
        }
    }

    private teardownE2eHooksWatchers(): void {
        try {
            this.e2eHooksObserver?.disconnect();
            this.e2eHooksObserver = undefined;
            if (this.e2eHooksRetryTimeout !== undefined) {
                clearTimeout(this.e2eHooksRetryTimeout);
                this.e2eHooksRetryTimeout = undefined;
            }
        } catch {
            // never throw
        }
    }

    private syncSubmitButtonDisabled(): void {
        try {
            const button = this.stampedSubmitButton;
            if (!button) return;

            const textOk = (this.currentInputText?.trim().length ?? 0) > 2;
            const enabled = this.smartConnectEnabled && textOk;
            // NOTE: deep-chat's submit control (#submit-icon) is a div/svg
            // wrapper, NOT a <button>. Playwright's is_disabled() only honours
            // the `disabled` attribute on real form controls; for everything
            // else it relies on `aria-disabled`. Set BOTH so the pib-backend
            // Playwright and Robot suites keep working.
            if (enabled) {
                button.removeAttribute("disabled");
                button.setAttribute("aria-disabled", "false");
            } else {
                button.setAttribute("disabled", "");
                button.setAttribute("aria-disabled", "true");
            }
        } catch {
            // never throw
        }
    }

    private subscribeToChatMessages(chatId: string): void {
        const el = this.deepChatRef?.nativeElement;
        if (!el) return;

        this.chatMessagesSubscription?.unsubscribe();
        this.chatMessagesSubscription = this.chatService
            .getChatMessagesObservable(chatId)
            .subscribe((messages) =>
                this.handleStreamedMessages(messages, el),
            );
    }

    private handleStreamedMessages(messages: ChatMessage[], el: any): void {
        if (!messages?.length) return;

        const newest = messages[messages.length - 1];
        if (newest.isUser) return;

        const {messageId, content} = newest;

        if (this.pendingSignals && content) {
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
                el.addMessage({role: "ai", text: content});
            }
            this.lastStreamedMessageId = messageId;
        }
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
