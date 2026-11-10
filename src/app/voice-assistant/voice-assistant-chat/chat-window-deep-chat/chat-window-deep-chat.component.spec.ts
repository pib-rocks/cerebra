import {ElementRef} from "@angular/core";
import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {HttpErrorResponse} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {BehaviorSubject, filter, of, Subject, take, throwError} from "rxjs";
import {ChatService} from "src/app/shared/services/chat.service";
import {TokenService} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {metaHtml} from "src/app/shared/types/chat-message-meta";
import {toDeepChat} from "src/app/shared/util/deep-chat-mapper";
import {ChatWindowDeepChatComponent} from "./chat-window-deep-chat.component";
import {Chat, ChatDto} from "src/app/shared/types/chat.class";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {
    CHAT_TRANSPORT_UNAVAILABLE,
    CLOUD_TOKEN_API_NAME,
    DEEP_CHAT_SMARTCONNECT_PLACEHOLDER,
    DEEP_CHAT_LIVE_SESSION_IDLE_PLACEHOLDER,
    DEEP_CHAT_BACKEND_DISCONNECTED_PLACEHOLDER,
    MISSING_KEY_TURN,
} from "src/app/shared/types/provider-registry";
import {
    CHAT_MESSAGE_MAX_LENGTH,
    chatMessageLengthRefusal,
} from "src/app/shared/types/chat-limits";
import {
    DEGRADED_MODE,
    UNLOCKED_MODE,
    degradedChatReply,
} from "src/app/system/keys/key-store-session";
import {KeyStoreService} from "src/app/system/keys/key-store.service";
import {KeyStoreSessionService} from "src/app/system/keys/key-store-session.service";
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";
import {
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    transportRequest,
} from "src/app/shared/types/channel-router";
import {VoiceAssistantState} from "src/app/shared/types/voice-assistant-state";
import {createServiceSpy} from "src/app/shared/testing/create-service-spy";
import {RosService} from "src/app/shared/services/ros-service/ros.service";

describe("ChatWindowDeepChatComponent", () => {
    let component: ChatWindowDeepChatComponent;
    let fixture: ComponentFixture<ChatWindowDeepChatComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid: string}>;
    let messagesSubject: BehaviorSubject<ChatMessage[]>;
    let tokenStatusSubject: BehaviorSubject<{
        tokenExists: boolean | null;
        tokenActive: boolean | null;
        service?: string;
        error?: string | null;
    }>;
    let voiceAssistantSpy: jasmine.SpyObj<VoiceAssistantService>;
    let keyStoreStatusSubject: BehaviorSubject<{
        encryptKeyStorage: boolean;
        credentialRefs: string[];
        mode?: string;
        voiceAssistant?: {state: string; reason?: string};
    }>;
    let mockDeepChat: {
        addMessage: jasmine.Spy;
        disableSubmitButton: jasmine.Spy;
        connect?: {handler: (body: any, signals: any) => void};
        loadHistory?: () => Promise<ReturnType<typeof toDeepChat>[]>;
        history?: ReturnType<typeof toDeepChat>[];
        validateInput?: (text?: string) => boolean;
        textInput?: unknown;
        [key: string]: unknown;
    };
    let voiceStateSubject: BehaviorSubject<VoiceAssistantState>;
    let connectionStatusSubject: BehaviorSubject<boolean>;

    const chatId = "chat-id";

    beforeEach(async () => {
        paramsSubject = new Subject<{chatUuid: string}>();
        tokenStatusSubject = new BehaviorSubject<{
            tokenExists: boolean | null;
            tokenActive: boolean | null;
            service?: string;
            error?: string | null;
        }>({
            tokenExists: true,
            tokenActive: true,
            service: "available",
        });
        keyStoreStatusSubject = new BehaviorSubject<{
            encryptKeyStorage: boolean;
            credentialRefs: string[];
            mode?: string;
        }>({
            encryptKeyStorage: true,
            credentialRefs: [],
            mode: "unlocked",
        });
        const keyStoreSpy = jasmine.createSpyObj("KeyStoreService", ["status"]);
        keyStoreSpy.status.and.returnValue(
            keyStoreStatusSubject.asObservable(),
        );
        messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj("ChatService", [
                "filterMessageUpdates",
                "getChatMessagesObservable",
                "getChatMessagesForHistory",
                "refreshChatMessages",
                "sendChatMessage",
                "getMessagesByChatId",
                "getChatMessage",
                "getChat",
                "createChat",
            ]);

        const tokenServiceSpy = createServiceSpy<TokenService>(
            "TokenService",
            ["checkTokenExists"],
            {
                tokenStatus$: tokenStatusSubject.asObservable(),
            },
        );
        // checkTokenExists() returns void on the real service, so there is no
        // value to stub: the typed spy exposed the old stub as dead code (PC-72).

        voiceStateSubject = new BehaviorSubject<VoiceAssistantState>({
            turnedOn: false,
            chatId: "",
        });
        const assistantModelsSubject = new BehaviorSubject<AssistantModel[]>(
            [],
        );
        voiceAssistantSpy = createServiceSpy<VoiceAssistantService>(
            "VoiceAssistantService",
            ["getPersonality", "voiceAssistantHealth"],
            {
                voiceAssistantStateObservable: voiceStateSubject.asObservable(),
                assistantModelsSubject,
            },
        );
        voiceAssistantSpy.voiceAssistantHealth.and.returnValue(of(null));

        connectionStatusSubject = new BehaviorSubject<boolean>(true);

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                ChatWindowDeepChatComponent,
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            data: {
                                personality: "12345",
                                chat: "53421",
                            },
                        },
                        params: paramsSubject,
                    },
                },
                {
                    provide: ChatService,
                    useValue: chatServiceSpy,
                },
                {
                    provide: TokenService,
                    useValue: tokenServiceSpy,
                },
                {
                    provide: KeyStoreService,
                    useValue: keyStoreSpy,
                },
                {
                    provide: VoiceAssistantService,
                    useValue: voiceAssistantSpy,
                },
                {
                    provide: RosService,
                    useValue: {
                        connectionStatus$:
                            connectionStatusSubject.asObservable(),
                    },
                },
            ],
        }).compileComponents();

        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;

        chatService.getChatMessagesObservable.and.returnValue(messagesSubject);
        // Mirrors the production pipeline: the empty seed is filtered out and the
        // loaded list passes exactly once.
        chatService.getChatMessagesForHistory.and.returnValue(
            messagesSubject.pipe(
                filter((messages) => messages.length > 0),
                take(1),
            ),
        );
        chatService.filterMessageUpdates.and.callFake(
            (messages: ChatMessage[]) => messages,
        );
        chatService.getMessagesByChatId.and.returnValue(of([]));
        chatService.sendChatMessage.and.returnValue(of(undefined));
        chatService.getChat.and.returnValue(undefined);

        const session = TestBed.inject(KeyStoreSessionService);
        session.mode = UNLOCKED_MODE;

        mockDeepChat = {
            addMessage: jasmine.createSpy("addMessage"),
            disableSubmitButton: jasmine.createSpy("disableSubmitButton"),
        };

        fixture = TestBed.createComponent(ChatWindowDeepChatComponent);
        component = fixture.componentInstance;
        component.deepChatRef = {
            nativeElement: mockDeepChat,
        } as ElementRef;

        component.ngOnInit();
        paramsSubject.next({chatUuid: chatId});
        component.ngAfterViewInit();
    });

    /**
     * Models reach the component through the service's own subject - the
     * component subscribes to it. The spy's property is not writable, so
     * replacing it with a new BehaviorSubject silently left the component
     * with no catalogue at all: every missing-key assertion in this file
     * passed vacuously (PC-63).
     */
    /**
     * deep-chat re-renders bubbles on overwrite and history sync; the mock
     * closes every turn-details block the way the real shadow DOM would.
     */
    const attachTurnDetailsShadow = (
        openAt: number[],
        count = 2,
    ): HTMLDetailsElement[] => {
        const details = Array.from({length: count}, (_, i) => {
            const el = document.createElement("details");
            el.className = "chat-message-meta turn-details";
            el.open = openAt.includes(i);
            return el;
        });
        const closeOnUpdate = (): void => {
            for (const d of details) {
                d.open = false;
            }
        };
        const shadow = {
            querySelectorAll: (sel: string) => {
                if (sel.includes("details")) {
                    return details;
                }
                return [] as HTMLDetailsElement[];
            },
            addEventListener: jasmine.createSpy("shadowToggleListen"),
        };
        (mockDeepChat as any).shadowRoot = shadow;
        mockDeepChat.addMessage.and.callFake((msg: unknown) => {
            closeOnUpdate();
            return msg;
        });
        let historyValue: ReturnType<typeof toDeepChat>[] | undefined;
        Object.defineProperty(mockDeepChat, "history", {
            configurable: true,
            get: () => historyValue,
            set: (v: ReturnType<typeof toDeepChat>[]) => {
                closeOnUpdate();
                historyValue = v;
            },
        });
        return details;
    };

    const publishModels = (models: AssistantModel[]): void => {
        const service = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        service.assistantModelsSubject.next(models);
    };

    afterEach(() => {
        component.ngOnDestroy();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("labels both conversation partners and keeps those names readable", () => {
        component.personalityName = "Ada";
        component.ngAfterViewInit();

        const names = mockDeepChat["names"] as {
            user: {text: string; style: {color: string}};
            ai: {text: string; style: {color: string}};
        };
        // Both names sit on the dark blue chat background; deep-chat would draw
        // them black without a colour of its own.
        expect(names.user.text).toBe("User");
        expect(names.user.style.color).toBe("#fff");
        expect(names.ai.text).toBe("Ada");
        expect(names.ai.style.color).toBe("#fff");
    });

    it("leaves out the chat and personality view toggle", () => {
        const registered = customElements.get("deep-chat");
        const prototype = registered?.prototype as
            | {connectedCallback?: () => void}
            | undefined;
        const connected = prototype?.connectedCallback;
        if (prototype != null) {
            prototype.connectedCallback = () => undefined;
        }
        const renderChat = component.ngAfterViewInit.bind(component);
        component.ngAfterViewInit = () => undefined;
        try {
            fixture.detectChanges();

            expect(
                fixture.nativeElement.querySelector(
                    "#chat-window-toggle-voice-assistant",
                ),
            ).toBeNull();
            expect(
                fixture.nativeElement.querySelector("a.toggle-button"),
            ).toBeNull();
        } finally {
            component.ngAfterViewInit = renderChat;
            if (prototype != null && connected != null) {
                prototype.connectedCallback = connected;
            }
        }
    });

    it("should store currentChatId from route params", () => {
        expect(component.currentChatId).toBe(chatId);
    });

    it("handler forwards extracted text to sendChatMessage", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        const body = {
            messages: [{role: "user", text: "hello there"}],
        };

        mockDeepChat.connect!.handler(body, signals);

        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "hello there",
        );
    });

    it("sends Direct and Smart through the same chat message call", () => {
        const soul = "Du bist pib.";
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            soul,
        );
        personality.channel = DIRECT_CHANNEL;
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        voiceAssistant.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const direct = component.turnForMessage("hello there");
        expect(direct.channel).toBe(DIRECT_CHANNEL);
        expect(direct.systemPrompt).toBe(soul);
        expect(direct.memory).toBeNull();

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );
        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "hello there",
        );

        personality.channel = SMART_CHANNEL;
        const smart = component.turnForMessage("hello there");
        expect(smart.systemPrompt).toBeNull();
        expect(transportRequest(chatId, smart)).toEqual(
            transportRequest(chatId, direct),
        );

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hel",
            },
        ]);
        mockDeepChat.addMessage.calls.reset();
        personality.channel = DIRECT_CHANNEL;
        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hello",
            },
        ]);
        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "ai",
            text: "Hello",
            overwrite: true,
        });
    });

    it("uses the SOUL text as the Direct system prompt when Hermes is disabled", () => {
        const capability = TestBed.inject(ChannelCapabilityService);
        capability.applyInstallerFlag(false);
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            null,
            10,
            undefined,
            SMART_CHANNEL,
        );
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        voiceAssistant.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const turn = component.turnForMessage("hello there");
        expect(turn.channel).toBe(DIRECT_CHANNEL);
        expect(turn.systemPrompt).toBe("Du bist pib.");
        expect(turn.memory).toBeNull();
        expect(transportRequest(chatId, turn)).toEqual({
            chat_id: chatId,
            content: "hello there",
        });
    });

    it("handler logs PERF_TRACE_UI SUBMIT_CLICK", () => {
        const consoleSpy = spyOn(console, "log");
        const signals = {onResponse: jasmine.createSpy("onResponse")};

        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(consoleSpy).toHaveBeenCalledWith(
            jasmine.stringMatching(
                /^\[PERF_TRACE_UI\] SUBMIT_CLICK chatId=chat-id t=\d+(\.\d+)?ms$/,
            ),
        );
    });

    it("logs PERF_TRACE_UI TTFT on first AI onResponse", () => {
        const consoleSpy = spyOn(console, "log");
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );
        consoleSpy.calls.reset();

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hel",
            },
        ]);

        expect(consoleSpy).toHaveBeenCalledWith(
            jasmine.stringMatching(/^\[PERF_TRACE_UI\] TTFT \d+(\.\d+)?ms$/),
        );

        consoleSpy.calls.reset();
        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hello",
            },
        ]);
        expect(consoleSpy).not.toHaveBeenCalledWith(
            jasmine.stringMatching(/^\[PERF_TRACE_UI\] TTFT/),
        );
    });

    it("blocks pre-dispatch when SmartConnect is off and encryption is on", () => {
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        const flash = new AssistantModel(
            7,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            "https://api.example/v1",
            flags,
            "provider-7",
            false,
        );
        voiceAssistant.assistantModelsSubject.next([flash]);
        voiceAssistant.getPersonality.and.returnValue(
            new VoiceAssistant("persona-1", "Ada", "Female", 0.8, "", 7),
        );
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        tokenStatusSubject.next({
            tokenExists: false,
            tokenActive: false,
            service: "available",
        });
        keyStoreStatusSubject.next({
            encryptKeyStorage: true,
            credentialRefs: ["provider-7"],
            mode: "unlocked",
        });
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            text: DEEP_CHAT_SMARTCONNECT_PLACEHOLDER,
        });
    });

    it("reports a missing chat transport without blaming the stored key", () => {
        chatService.sendChatMessage.and.returnValue(
            throwError(
                () => new Error("Service /send_chat_message does not exist"),
            ),
        );
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );
        expect(signals.onResponse).toHaveBeenCalledWith({
            text: CHAT_TRANSPORT_UNAVAILABLE,
        });
    });

    it("handler error path calls onResponse with error", () => {
        chatService.sendChatMessage.and.returnValue(
            throwError(() => new Error("ros disconnected")),
        );
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        const body = {
            messages: [{role: "user", text: "hello there"}],
        };

        mockDeepChat.connect!.handler(body, signals);

        expect(signals.onResponse).toHaveBeenCalledWith({
            error: "Error: ros disconnected",
        });
    });

    it("assigns the buffered history to the property without reversing it", () => {
        const firstMessage: ChatMessage = {
            messageId: "message-id-1",
            timestamp: "yesterday",
            isUser: false,
            content: "first",
        };
        const secondMessage: ChatMessage = {
            messageId: "message-id-2",
            timestamp: "today",
            isUser: true,
            content: "second",
        };
        chatService.filterMessageUpdates.and.returnValue([
            firstMessage,
            secondMessage,
        ]);
        chatService.getMessagesByChatId.calls.reset();

        messagesSubject.next([firstMessage, secondMessage]);

        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledWith(
            chatId,
        );
        expect(chatService.getMessagesByChatId).not.toHaveBeenCalled();
        // deep-chat 2.5.1 accepts a property assignment after rendering, so the
        // widget is fed without loadHistory and without addMessage.
        expect(mockDeepChat.loadHistory).toBeUndefined();
        expect(mockDeepChat.history).toEqual([
            {role: "ai", text: "first"},
            {role: "user", text: "second"},
        ]);
    });

    it("never appends a bubble for a message the history already painted", () => {
        const message: ChatMessage = {
            messageId: "message-id-1",
            timestamp: "yesterday",
            isUser: false,
            content: "first",
        };
        chatService.filterMessageUpdates.and.returnValue([message]);

        messagesSubject.next([message]);

        expect(mockDeepChat.history).toEqual([{role: "ai", text: "first"}]);
        // A streamed repeat of a message that is already on screen must overwrite
        // in place. Anything that appends would be the duplicated bubble this
        // story exists to remove.
        const appended = mockDeepChat.addMessage.calls
            .allArgs()
            .map(([args]) => args)
            .filter((args) => args?.overwrite !== true);
        expect(appended).toEqual([]);
    });

    it("appends a streamed message after the history exactly once", () => {
        const historyMessage: ChatMessage = {
            messageId: "message-id-1",
            timestamp: "yesterday",
            isUser: true,
            content: "first",
        };
        const streamed: ChatMessage = {
            messageId: "message-id-2",
            timestamp: "today",
            isUser: false,
            content: "streamed",
        };
        chatService.filterMessageUpdates.and.callFake((messages) => messages);

        messagesSubject.next([historyMessage]);
        const appendedBefore = mockDeepChat.addMessage.calls
            .allArgs()
            .map(([args]) => args)
            .filter((args) => args?.overwrite !== true);
        expect(appendedBefore).toEqual([]);

        messagesSubject.next([historyMessage, streamed]);

        const appendedAfter = mockDeepChat.addMessage.calls
            .allArgs()
            .map(([args]) => args)
            .filter((args) => args?.overwrite !== true);
        expect(appendedAfter.length).toBe(1);
        expect(
            appendedAfter[0] as unknown as {role: string; text: string},
        ).toEqual({
            role: "ai",
            text: "streamed",
        });
    });

    it("reads the buffered history once per chat and re-reads on a chat switch", () => {
        const message: ChatMessage = {
            messageId: "message-id-1",
            timestamp: "yesterday",
            isUser: false,
            content: "first",
        };
        chatService.filterMessageUpdates.and.returnValue([message]);
        chatService.getMessagesByChatId.calls.reset();

        // One read when the view initialises - not one per widget call.
        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledTimes(1);
        messagesSubject.next([message]);
        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledTimes(1);
        component.ngAfterViewInit();
        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledTimes(1);

        paramsSubject.next({chatUuid: "other-chat-id"});

        expect(chatService.getMessagesByChatId).not.toHaveBeenCalled();
        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledTimes(2);
        expect(chatService.getChatMessagesForHistory).toHaveBeenCalledWith(
            "other-chat-id",
        );
    });

    it("refreshes buffered history when the route chat id changes", () => {
        chatService.refreshChatMessages.calls.reset();
        paramsSubject.next({chatUuid: "other-chat-id"});
        expect(chatService.refreshChatMessages).toHaveBeenCalledOnceWith(
            "other-chat-id",
        );
    });

    it("first AI chunk resolves onResponse exactly once", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );

        messagesSubject.next([
            {
                messageId: "user-1",
                timestamp: "1",
                isUser: true,
                content: "hi there",
            },
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hel",
            },
        ]);

        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            role: "ai",
            text: "Hel",
        });
        expect(mockDeepChat.addMessage).not.toHaveBeenCalled();

        messagesSubject.next([
            {
                messageId: "user-1",
                timestamp: "1",
                isUser: true,
                content: "hi there",
            },
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hello",
            },
        ]);

        expect(signals.onResponse).toHaveBeenCalledTimes(1);
    });

    it("second chunk with same messageId calls addMessage with overwrite true", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hel",
            },
        ]);
        mockDeepChat.addMessage.calls.reset();

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hello",
            },
        ]);

        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "ai",
            text: "Hello",
            overwrite: true,
        });
    });

    it("paints a picture a tool captured once the answer has settled", fakeAsync(() => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "mach ein foto"}]},
            signals,
        );

        messagesSubject.next([
            {
                messageId: "user-1",
                timestamp: "1",
                isUser: true,
                content: "mach ein foto",
            },
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hier ist das Bild.",
            },
        ]);

        chatService.getChatMessage.and.returnValue(
            of({
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hier ist das Bild.",
                meta: {
                    source: "direct-tool-loop",
                    images: [
                        {
                            id: "image-1",
                            mimeType: "image/jpeg",
                            width: 1024,
                            height: 768,
                            url: `/voice-assistant/chat/${chatId}/messages/ai-1/images/0`,
                        },
                    ],
                },
            }),
        );

        tick(component["imageRefreshDelayMs"] + 10);

        expect(chatService.getChatMessage).toHaveBeenCalledWith(chatId, "ai-1");
        expect(mockDeepChat.addMessage).toHaveBeenCalledWith(
            jasmine.objectContaining({
                role: "ai",
                text: "Hier ist das Bild.",
                html: metaHtml({
                    source: "direct-tool-loop",
                    images: [
                        {
                            id: "image-1",
                            mimeType: "image/jpeg",
                            width: 1024,
                            height: 768,
                            url: `/voice-assistant/chat/${chatId}/messages/ai-1/images/0`,
                        },
                    ],
                }),
                files: [
                    {
                        src: `/api/voice-assistant/chat/${chatId}/messages/ai-1/images/0`,
                        type: "image",
                        name: "capture.jpg",
                    },
                ],
                overwrite: true,
            }),
        );
    }));

    it("re-opens turn details after a streaming overwrite", fakeAsync(() => {
        const detailsEls = attachTurnDetailsShadow([0]);
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi"}]},
            signals,
        );
        mockDeepChat.addMessage.calls.reset();

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hel",
            },
        ]);
        tick(0);
        expect(detailsEls[0].open).toBeTrue();

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Hello",
            },
        ]);
        tick(0);
        expect(detailsEls[0].open).toBeTrue();
    }));

    it("re-opens turn details after history sync", fakeAsync(() => {
        const detailsEls = attachTurnDetailsShadow([1]);
        component["assignHistoryPreservingTurnDetails"](mockDeepChat, [
            {role: "ai", text: "first"},
        ]);
        tick(0);
        expect(detailsEls[1].open).toBeTrue();
    }));

    it("re-opens turn details after image refresh overwrite", fakeAsync(() => {
        const detailsEls = attachTurnDetailsShadow([0]);
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "foto"}]},
            signals,
        );
        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Bild.",
            },
        ]);
        chatService.getChatMessage.and.returnValue(
            of({
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "Bild.",
                meta: {
                    source: "direct-tool-loop",
                    images: [
                        {
                            url: `/voice-assistant/chat/${chatId}/messages/ai-1/images/0`,
                            mimeType: "image/jpeg",
                        },
                    ],
                },
            }),
        );
        tick(component["imageRefreshDelayMs"] + 10);
        tick(0);
        expect(detailsEls[0].open).toBeTrue();
    }));

    it("leaves the answer alone when the turn captured nothing", fakeAsync(() => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hallo"}]},
            signals,
        );
        messagesSubject.next([
            {
                messageId: "ai-2",
                timestamp: "3",
                isUser: false,
                content: "Hallo!",
            },
        ]);
        chatService.getChatMessage.and.returnValue(
            of({
                messageId: "ai-2",
                timestamp: "3",
                isUser: false,
                content: "Hallo!",
                meta: {source: "pib-cloud"},
            }),
        );

        tick(component["imageRefreshDelayMs"] + 10);

        // One lookup per settled answer, and no attachment without a picture.
        expect(chatService.getChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "ai-2",
        );
        expect(mockDeepChat.addMessage).not.toHaveBeenCalled();
    }));

    it("handles rapid sub-1s streaming chunks without dropping overwrites", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        const consoleSpy = spyOn(console, "log");
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );

        const chunks = ["H", "He", "Hel", "Hell", "Hello"];
        for (const content of chunks) {
            messagesSubject.next([
                {
                    messageId: "ai-fast-1",
                    timestamp: "2",
                    isUser: false,
                    content,
                },
            ]);
        }

        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            role: "ai",
            text: "H",
        });
        expect(mockDeepChat.addMessage).toHaveBeenCalledTimes(
            chunks.length - 1,
        );
        expect(mockDeepChat.addMessage.calls.mostRecent().args[0]).toEqual({
            role: "ai",
            text: "Hello",
            overwrite: true,
        });

        const ttftCalls = consoleSpy.calls
            .allArgs()
            .filter((args) =>
                String(args[0]).startsWith("[PERF_TRACE_UI] TTFT"),
            );
        expect(ttftCalls.length).toBe(1);
        const ttftMatch = String(ttftCalls[0][0]).match(
            /^\[PERF_TRACE_UI\] TTFT (\d+(?:\.\d+)?)ms$/,
        );
        expect(ttftMatch).not.toBeNull();
        expect(Number(ttftMatch![1])).toBeLessThan(1000);
    });

    it("a new messageId appends without overwrite", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "First reply",
            },
        ]);
        mockDeepChat.addMessage.calls.reset();

        messagesSubject.next([
            {
                messageId: "ai-1",
                timestamp: "2",
                isUser: false,
                content: "First reply",
            },
            {
                messageId: "ai-2",
                timestamp: "3",
                isUser: false,
                content: "Second reply",
            },
        ]);

        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "ai",
            text: "Second reply",
        });
        expect(mockDeepChat.addMessage).not.toHaveBeenCalledWith(
            jasmine.objectContaining({overwrite: true}),
        );
    });

    it("disables Natural Chat typing until the voice session is active", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: true},
        );
        voiceAssistantSpy.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: false, chatId: ""});

        expect(mockDeepChat.textInput).toEqual({
            disabled: true,
            placeholder: {text: DEEP_CHAT_LIVE_SESSION_IDLE_PLACEHOLDER},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
        expect(mockDeepChat.disableSubmitButton).toHaveBeenCalledWith(true);
    });

    it("re-enables Natural Chat typing when the live session opens for this chat", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: true},
        );
        voiceAssistantSpy.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: false, chatId: ""});
        mockDeepChat.disableSubmitButton.calls.reset();

        voiceStateSubject.next({turnedOn: true, chatId});

        expect(mockDeepChat.textInput).toEqual({
            disabled: false,
            placeholder: {text: "Enter a message"},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
        expect(mockDeepChat.disableSubmitButton).toHaveBeenCalledWith(false);
    });

    it("keeps turn_based chat typable while the voice session is off", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: false},
        );
        voiceAssistantSpy.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: false, chatId: ""});

        expect(mockDeepChat.textInput).toEqual({
            disabled: false,
            placeholder: {text: "Enter a message"},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
    });

    it("does not rewrite the composer when an identical voice state arrives again", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: false},
        );
        voiceAssistantSpy.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: false, chatId: ""});
        mockDeepChat.disableSubmitButton.calls.reset();

        // The ~1 Hz voice-state topic re-emits the identical state. Re-applying
        // textInput would clear the user's in-progress text, so it must be skipped.
        voiceStateSubject.next({turnedOn: false, chatId: ""});

        expect(mockDeepChat.disableSubmitButton).not.toHaveBeenCalled();
    });

    it("shows a disconnect hint for Natural Chat when the robot link drops", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: true},
        );
        voiceAssistantSpy.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: true, chatId});

        connectionStatusSubject.next(false);

        expect(mockDeepChat.textInput).toEqual({
            disabled: true,
            placeholder: {text: DEEP_CHAT_BACKEND_DISCONNECTED_PLACEHOLDER},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
    });

    it("keeps typed input working while a live model holds this chat", () => {
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            11,
            10,
            "11",
            SMART_CHANNEL,
            {live: true},
        );
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        voiceAssistant.getPersonality.and.returnValue(personality);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        voiceStateSubject.next({turnedOn: true, chatId});

        const signals = {
            onResponse: jasmine.createSpy("onResponse"),
            onClose: jasmine.createSpy("onClose"),
        };
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "  hello there  "}]},
            signals,
        );

        expect(mockDeepChat.textInput).toEqual({
            disabled: false,
            placeholder: {text: "Enter a message"},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "hello there",
        );
        expect(signals.onClose).toHaveBeenCalled();
        expect(signals.onResponse).not.toHaveBeenCalled();

        messagesSubject.next([
            {
                messageId: "ai-live",
                timestamp: "2",
                isUser: false,
                content: "I heard you",
            },
        ]);
        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "ai",
            text: "I heard you",
        });

        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "stop now please"}]},
            signals,
        );
        expect(chatService.sendChatMessage).toHaveBeenCalledWith(
            chatId,
            "stop now please",
        );
        expect(signals.onClose).toHaveBeenCalledTimes(2);
        expect(mockDeepChat.textInput).toEqual(
            jasmine.objectContaining({
                disabled: false,
                characterLimit: CHAT_MESSAGE_MAX_LENGTH,
            }),
        );
    });

    it("ignores the typed isUser echo but renders spoken isUser messages from Voice Interaction", () => {
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hi there"}]},
            signals,
        );

        messagesSubject.next([
            {
                messageId: "user-1",
                timestamp: "1",
                isUser: true,
                content: "hi there",
            },
        ]);

        expect(signals.onResponse).not.toHaveBeenCalled();
        expect(mockDeepChat.addMessage).not.toHaveBeenCalled();

        // Subsequent spoken user utterance (no typed submit) is rendered in deep-chat
        messagesSubject.next([
            {
                messageId: "user-spoken-2",
                timestamp: "2",
                isUser: true,
                content: "Hallo pib, wie geht es dir?",
            },
        ]);

        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "user",
            text: "Hallo pib, wie geht es dir?",
        });

        // Streaming update to the same spoken user messageId overwrites in place
        messagesSubject.next([
            {
                messageId: "user-spoken-2",
                timestamp: "3",
                isUser: true,
                content: "Hallo pib, wie geht es dir heute?",
            },
        ]);

        expect(mockDeepChat.addMessage).toHaveBeenCalledWith({
            role: "user",
            text: "Hallo pib, wie geht es dir heute?",
            overwrite: true,
        });
    });

    it("enables input when SmartConnect is on or key storage encryption is off", () => {
        // encryption off + SmartConnect off -> enabled
        tokenStatusSubject.next({tokenExists: false, tokenActive: false});
        keyStoreStatusSubject.next({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });

        expect(
            mockDeepChat.disableSubmitButton.calls.mostRecent().args,
        ).toEqual([false]);
        expect(mockDeepChat.textInput).toEqual({
            disabled: false,
            placeholder: {text: "Enter a message"},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });

        // SmartConnect on + encryption on -> enabled
        tokenStatusSubject.next({tokenExists: true, tokenActive: true});
        keyStoreStatusSubject.next({
            encryptKeyStorage: true,
            credentialRefs: [],
            mode: "unlocked",
        });

        expect(mockDeepChat.textInput).toEqual({
            disabled: false,
            placeholder: {text: "Enter a message"},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });

        // both off -> disabled, placeholder names the missing prerequisite
        tokenStatusSubject.next({tokenExists: false, tokenActive: false});
        keyStoreStatusSubject.next({
            encryptKeyStorage: true,
            credentialRefs: [],
            mode: "unlocked",
        });

        expect(
            mockDeepChat.disableSubmitButton.calls.mostRecent().args,
        ).toEqual([true]);
        expect(mockDeepChat.textInput).toEqual({
            disabled: true,
            placeholder: {
                text: "Enable SmartConnect or deactivate key storage encryption to start the Voice-Assistant",
            },
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
    });

    it("answers in the personality's voice when the key store is in degraded mode", () => {
        const session = TestBed.inject(KeyStoreSessionService);
        session.cancel();
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        voiceAssistant.getPersonality.and.returnValue(
            new VoiceAssistant("persona-1", "Ada", "Female", 0.8, "", 4),
        );
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();
        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            role: "ai",
            text: degradedChatReply("Ada"),
        });
        expect(degradedChatReply("Ada")).toContain("I'm Ada.");
        expect(degradedChatReply("Ada")).toContain("Smart chat");
        expect(degradedChatReply("Ada")).toContain("Direct chat");
        expect(degradedChatReply("Ada")).toContain("provider keys");
    });

    it("disables the composer when encryption is off but the model key is gone", () => {
        tokenStatusSubject.next({
            tokenExists: false,
            tokenActive: false,
            service: "available",
        });
        keyStoreStatusSubject.next({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const model = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            "https://api.openai.example/v1",
            {
                tools: true,
                images: true,
                live: false,
                stt: false,
                tts: false,
            },
            null,
            false,
        );
        publishModels([model]);
        voiceAssistant.getPersonality.and.returnValue(
            new VoiceAssistant("persona-1", "Ada", "Female", 0.8, "", 4),
        );
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        component.ngAfterViewInit();

        expect(mockDeepChat.textInput).toEqual({
            disabled: true,
            placeholder: {text: MISSING_KEY_TURN},
            characterLimit: CHAT_MESSAGE_MAX_LENGTH,
        });
    });

    it("sends a turn for pib.Cloud with a stored credential while the token probe is unavailable", () => {
        tokenStatusSubject.next({
            tokenExists: null,
            tokenActive: null,
            service: "unavailable",
            error: "Service /get_token_exists does not exist",
        });
        keyStoreStatusSubject.next({
            encryptKeyStorage: false,
            credentialRefs: ["provider-4"],
            mode: "unlocked",
        });
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const cloud = new AssistantModel(
            5,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            {
                tools: true,
                images: true,
                live: false,
                stt: false,
                tts: false,
            },
            "provider-4",
            false,
        );
        publishModels([cloud]);
        voiceAssistant.getPersonality.and.returnValue(
            new VoiceAssistant(
                "persona-1",
                "Ada",
                "Female",
                0.8,
                "",
                5,
                10,
                "5",
            ),
        );
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});
        component.ngAfterViewInit();

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(mockDeepChat.textInput).toEqual(
            jasmine.objectContaining({
                disabled: false,
                characterLimit: CHAT_MESSAGE_MAX_LENGTH,
            }),
        );
        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "hello there",
        );
    });

    it("marks a personality whose key was deleted instead of sending the turn", () => {
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const model = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            "https://api.openai.example/v1",
            {
                tools: true,
                images: true,
                live: false,
                stt: false,
                tts: false,
            },
            null,
            false,
        );
        publishModels([model]);
        voiceAssistant.getPersonality.and.returnValue(
            new VoiceAssistant("persona-1", "Ada", "Female", 0.8, "", 4),
        );
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            text: MISSING_KEY_TURN,
        });
    });

    it("starts a turn when the personality still has the model it used", () => {
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        const flash = new AssistantModel(
            7,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags,
            "provider-1",
            false,
        );
        const live = new AssistantModel(
            11,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            false,
            null,
            {...flags, images: false, live: true},
            "provider-1",
            false,
        );
        publishModels([flash, live]);
        const persona = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "",
            7,
            10,
            "7",
        );
        voiceAssistant.getPersonality.and.returnValue(persona);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "hello there",
        );
    });

    it("refuses the turn when the model row is gone and does not start it on another model", () => {
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const persona = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "",
            null,
            10,
            "12",
        );
        persona.needsNewModel = true;
        voiceAssistant.getPersonality.and.returnValue(persona);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            text: "This model is gone. Choose a new one.",
        });
    });

    it("asks for a new model when the catalogue is loaded and the row is not in it", () => {
        const voiceAssistant = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        publishModels([
            new AssistantModel(
                7,
                "gemini-3.8-flash",
                "Gemini 3.8 Flash",
                true,
                null,
                flags,
                "provider-1",
                false,
            ),
            new AssistantModel(
                11,
                "gemini-3.8-live",
                "Gemini 3.8 Live",
                false,
                null,
                {...flags, images: false, live: true},
                "provider-1",
                false,
            ),
        ]);
        const persona = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "",
            null,
            10,
            "12",
        );
        persona.needsNewModel = true;
        voiceAssistant.getPersonality.and.returnValue(persona);
        chatService.getChat.and.returnValue(
            new Chat("topic", "persona-1", chatId),
        );
        paramsSubject.next({chatUuid: chatId});

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            text: "This model is gone. Choose a new one.",
        });
    });

    it("validateInput accepts one or more characters and rejects blank input", () => {
        expect(mockDeepChat.validateInput!("a")).toBeTrue();
        expect(mockDeepChat.validateInput!("ab")).toBeTrue();
        expect(mockDeepChat.validateInput!("  ab  ")).toBeTrue();
        expect(mockDeepChat.validateInput!("abc")).toBeTrue();
        expect(mockDeepChat.validateInput!("abcd")).toBeTrue();
        expect(mockDeepChat.validateInput!("")).toBeFalse();
        expect(mockDeepChat.validateInput!("   ")).toBeFalse();
    });

    it("a single character is typeable and sendable", () => {
        expect(mockDeepChat.validateInput!("a")).toBeTrue();

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "a"}]},
            signals,
        );

        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            "a",
        );
    });

    it("refuses a line one character over the limit and does not send it", () => {
        const overLimit = "a".repeat(CHAT_MESSAGE_MAX_LENGTH + 1);
        const expected = chatMessageLengthRefusal(overLimit);
        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: overLimit}]},
            signals,
        );

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(signals.onResponse).toHaveBeenCalledOnceWith({
            text: expected,
        });
    });
});

describe("ChatWindowDeepChatComponent fresh chat without id", () => {
    const personalityUuid = "persona-uuid";
    const createdChatId = "created-chat-id";
    const existingChatId = "chat-id";

    let component: ChatWindowDeepChatComponent;
    let fixture: ComponentFixture<ChatWindowDeepChatComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid?: string}>;
    let messagesSubject: BehaviorSubject<ChatMessage[]>;
    let tokenStatusSubject: BehaviorSubject<{
        tokenExists: boolean | null;
        tokenActive: boolean | null;
        service?: string;
        error?: string | null;
    }>;
    let keyStoreStatusSubject: BehaviorSubject<{
        encryptKeyStorage: boolean;
        credentialRefs: string[];
        mode?: string;
        voiceAssistant?: {state: string; reason?: string};
    }>;
    let mockDeepChat: {
        addMessage: jasmine.Spy;
        disableSubmitButton: jasmine.Spy;
        connect?: {handler: (body: any, signals: any) => void};
        loadHistory?: () => Promise<ReturnType<typeof toDeepChat>[]>;
        validateInput?: (text?: string) => boolean;
        textInput?: unknown;
        defaultInput?: {text: string};
        [key: string]: unknown;
    };
    let router: Router;

    beforeEach(async () => {
        paramsSubject = new Subject<{chatUuid?: string}>();
        tokenStatusSubject = new BehaviorSubject<{
            tokenExists: boolean | null;
            tokenActive: boolean | null;
            service?: string;
            error?: string | null;
        }>({
            tokenExists: true,
            tokenActive: true,
            service: "available",
        });
        keyStoreStatusSubject = new BehaviorSubject<{
            encryptKeyStorage: boolean;
            credentialRefs: string[];
            mode?: string;
        }>({
            encryptKeyStorage: true,
            credentialRefs: [],
            mode: "unlocked",
        });
        const keyStoreSpy = jasmine.createSpyObj("KeyStoreService", ["status"]);
        keyStoreSpy.status.and.returnValue(
            keyStoreStatusSubject.asObservable(),
        );
        messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj("ChatService", [
                "filterMessageUpdates",
                "getChatMessagesObservable",
                "getChatMessagesForHistory",
                "refreshChatMessages",
                "sendChatMessage",
                "getMessagesByChatId",
                "getChatMessage",
                "getChat",
                "createChat",
            ]);

        const tokenServiceSpy = createServiceSpy<TokenService>(
            "TokenService",
            ["checkTokenExists"],
            {tokenStatus$: tokenStatusSubject.asObservable()},
        );

        const voiceStateSubject = new BehaviorSubject<VoiceAssistantState>({
            turnedOn: false,
            chatId: "",
        });
        const assistantModelsSubject = new BehaviorSubject<AssistantModel[]>(
            [],
        );
        const voiceAssistantSpy = createServiceSpy<VoiceAssistantService>(
            "VoiceAssistantService",
            ["getPersonality", "voiceAssistantHealth"],
            {
                voiceAssistantStateObservable: voiceStateSubject.asObservable(),
                assistantModelsSubject,
            },
        );
        voiceAssistantSpy.voiceAssistantHealth.and.returnValue(of(null));
        voiceAssistantSpy.getPersonality.and.returnValue(
            new VoiceAssistant(
                personalityUuid,
                "Ada",
                "Female",
                0.8,
                "Du bist pib.",
            ),
        );

        const parentRoute = {
            snapshot: {params: {personalityUuid}},
            params: of({personalityUuid}),
        };

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                ChatWindowDeepChatComponent,
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {params: {}, parent: parentRoute},
                        params: paramsSubject.asObservable(),
                        parent: parentRoute,
                    },
                },
                {provide: ChatService, useValue: chatServiceSpy},
                {provide: TokenService, useValue: tokenServiceSpy},
                {provide: KeyStoreService, useValue: keyStoreSpy},
                {provide: VoiceAssistantService, useValue: voiceAssistantSpy},
                {
                    provide: RosService,
                    useValue: {
                        connectionStatus$: of(true),
                    },
                },
            ],
        }).compileComponents();

        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;
        chatService.getChatMessagesObservable.and.returnValue(messagesSubject);
        chatService.getChatMessagesForHistory.and.returnValue(messagesSubject);
        chatService.filterMessageUpdates.and.callFake(
            (messages: ChatMessage[]) => messages,
        );
        chatService.getMessagesByChatId.and.returnValue(of([]));
        chatService.sendChatMessage.and.returnValue(of(undefined));
        chatService.createChat.and.returnValue(
            of(new Chat("hello there", personalityUuid, createdChatId)),
        );
        chatService.getChat.and.callFake((id: string) =>
            id === createdChatId
                ? new Chat("hello there", personalityUuid, createdChatId)
                : id === existingChatId
                ? new Chat("topic", personalityUuid, existingChatId)
                : undefined,
        );

        TestBed.inject(KeyStoreSessionService).mode = UNLOCKED_MODE;

        router = TestBed.inject(Router);
        spyOn(router, "navigate").and.returnValue(Promise.resolve(true));

        mockDeepChat = {
            addMessage: jasmine.createSpy("addMessage"),
            disableSubmitButton: jasmine.createSpy("disableSubmitButton"),
        };

        fixture = TestBed.createComponent(ChatWindowDeepChatComponent);
        component = fixture.componentInstance;
        component.deepChatRef = {
            nativeElement: mockDeepChat,
        } as ElementRef;

        component.ngOnInit();
        paramsSubject.next({});
        component.ngAfterViewInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it("creates the chat with the first message and sends the turn with the new id", () => {
        chatService.createChat.and.returnValue(
            of(new Chat("hello there", personalityUuid, createdChatId)),
        );
        chatService.createChat.calls.reset();
        chatService.sendChatMessage.calls.reset();

        paramsSubject.next({});
        // PR-2046: no chat is created just by opening the window - the app routes
        // /chat to the last conversation, so an eager create would leave orphans.
        expect(chatService.createChat).not.toHaveBeenCalled();

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.createChat).toHaveBeenCalledOnceWith(
            new ChatDto("hello there", personalityUuid),
        );
        expect(component.currentChatId).toBe(createdChatId);
        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            createdChatId,
            "hello there",
        );
    });

    it("clears the history property for an empty chat id and skips the API", () => {
        component.currentChatId = undefined;
        mockDeepChat["history"] = [{role: "ai", text: "stale"}];
        chatService.getMessagesByChatId.calls.reset();
        chatService.getChatMessagesForHistory.calls.reset();

        component.ngAfterViewInit();

        expect(mockDeepChat["history"]).toEqual([]);
        expect(chatService.getMessagesByChatId).not.toHaveBeenCalled();
        expect(chatService.getChatMessagesForHistory).not.toHaveBeenCalled();
    });

    it("names a failed chat creation and puts the typed text back", () => {
        chatService.createChat.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 503,
                        statusText: "Service Unavailable",
                        error: {error: "chat store offline"},
                    }),
            ),
        );
        // deep-chat's live composer is a contenteditable div, not a textarea.
        const composer = {
            isContentEditable: true,
            textContent: "",
            dispatchEvent: jasmine.createSpy("dispatchEvent"),
        };
        (mockDeepChat as any).shadowRoot = {querySelector: () => composer};

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "still here"}]},
            signals,
        );

        const shown =
            signals.onResponse.calls.mostRecent()?.args[0]?.text ?? "";
        expect(shown).toMatch(/503/);
        expect(shown).toMatch(/chat store offline/);
        expect(composer.textContent).toBe("still here");
        expect(composer.dispatchEvent).toHaveBeenCalled();
        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
    });

    it("never calls createChat when the route already has an id", () => {
        paramsSubject.next({chatUuid: existingChatId});
        component.ngAfterViewInit();
        chatService.createChat.calls.reset();
        chatService.sendChatMessage.calls.reset();

        const signals = {onResponse: jasmine.createSpy("onResponse")};
        mockDeepChat.connect!.handler(
            {messages: [{role: "user", text: "hello there"}]},
            signals,
        );

        expect(chatService.createChat).not.toHaveBeenCalled();
        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            existingChatId,
            "hello there",
        );
    });
});
