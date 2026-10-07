import {ElementRef} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {BehaviorSubject, of, Subject, throwError} from "rxjs";
import {ChatService} from "src/app/shared/services/chat.service";
import {TokenService} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {toDeepChat} from "src/app/shared/util/deep-chat-mapper";
import {ChatWindowDeepChatComponent} from "./chat-window-deep-chat.component";
import {Chat} from "src/app/shared/types/chat.class";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {MISSING_KEY_TURN} from "src/app/shared/types/provider-registry";
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

describe("ChatWindowDeepChatComponent", () => {
    let component: ChatWindowDeepChatComponent;
    let fixture: ComponentFixture<ChatWindowDeepChatComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid: string}>;
    let messagesSubject: BehaviorSubject<ChatMessage[]>;
    let tokenStatusSubject: BehaviorSubject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>;
    let keyStoreStatusSubject: BehaviorSubject<{
        encryptKeyStorage: boolean;
        credentialRefs: string[];
        mode?: string;
    }>;
    let mockDeepChat: {
        addMessage: jasmine.Spy;
        disableSubmitButton: jasmine.Spy;
        connect?: {handler: (body: any, signals: any) => void};
        loadHistory?: () => Promise<ReturnType<typeof toDeepChat>[]>;
        validateInput?: (text?: string) => boolean;
        textInput?: unknown;
        [key: string]: unknown;
    };
    let voiceStateSubject: BehaviorSubject<VoiceAssistantState>;

    const chatId = "chat-id";

    beforeEach(async () => {
        paramsSubject = new Subject<{chatUuid: string}>();
        tokenStatusSubject = new BehaviorSubject<{
            tokenExists: boolean;
            tokenActive: boolean;
        }>({
            tokenExists: true,
            tokenActive: true,
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
                "sendChatMessage",
                "getMessagesByChatId",
                "getChat",
            ]);

        const tokenServiceSpy = jasmine.createSpyObj("TokenService", [], {
            tokenStatus$: tokenStatusSubject.asObservable(),
        });

        voiceStateSubject = new BehaviorSubject<VoiceAssistantState>({
            turnedOn: false,
            chatId: "",
        });
        const voiceAssistantSpy = jasmine.createSpyObj(
            "VoiceAssistantService",
            ["getPersonality"],
            {
                voiceAssistantStateObservable: voiceStateSubject.asObservable(),
            },
        );

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
            ],
        }).compileComponents();

        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;

        chatService.getChatMessagesObservable.and.returnValue(messagesSubject);
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

    afterEach(() => {
        component.ngOnDestroy();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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

    it("loadHistory maps messages and does not reverse", async () => {
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
        chatService.getMessagesByChatId.and.returnValue(
            of([firstMessage, secondMessage]),
        );
        chatService.filterMessageUpdates.and.returnValue([
            firstMessage,
            secondMessage,
        ]);

        const result = await mockDeepChat.loadHistory!();

        expect(chatService.getMessagesByChatId).toHaveBeenCalledWith(chatId);
        expect(result).toEqual([
            toDeepChat(firstMessage),
            toDeepChat(secondMessage),
        ]);
        expect(result[0]).toEqual({role: "ai", text: "first"});
        expect(result[1]).toEqual({role: "user", text: "second"});
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
            jasmine.objectContaining({disabled: false}),
        );
    });

    it("isUser messages are ignored", () => {
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
        voiceAssistant.assistantModelsSubject = new BehaviorSubject([model]);
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
        voiceAssistant.assistantModelsSubject = new BehaviorSubject([
            flash,
            live,
        ]);
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
        voiceAssistant.assistantModelsSubject = new BehaviorSubject([
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
});
