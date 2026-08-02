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
    let mockDeepChat: {
        addMessage: jasmine.Spy;
        disableSubmitButton: jasmine.Spy;
        connect?: {handler: (body: any, signals: any) => void};
        loadHistory?: () => Promise<ReturnType<typeof toDeepChat>[]>;
        validateInput?: (text?: string) => boolean;
        textInput?: unknown;
        [key: string]: unknown;
    };

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

        const voiceAssistantSpy = jasmine.createSpyObj(
            "VoiceAssistantService",
            ["getPersonality"],
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
        expect(mockDeepChat.addMessage).toHaveBeenCalledTimes(chunks.length - 1);
        expect(mockDeepChat.addMessage.calls.mostRecent().args[0]).toEqual({
            role: "ai",
            text: "Hello",
            overwrite: true,
        });

        const ttftCalls = consoleSpy.calls
            .allArgs()
            .filter((args) => String(args[0]).startsWith("[PERF_TRACE_UI] TTFT"));
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

    it("SmartConnect off disables input and sets the exact placeholder text", () => {
        tokenStatusSubject.next({tokenExists: false, tokenActive: false});

        expect(mockDeepChat.disableSubmitButton).toHaveBeenCalledWith(true);
        expect(mockDeepChat.textInput).toEqual({
            disabled: true,
            placeholder: {
                text: "Enable SmartConnect to start the Voice-Assistant",
            },
        });
    });

    it("validateInput returns false for 2 chars and true for 3 chars", () => {
        expect(mockDeepChat.validateInput!("ab")).toBeFalse();
        expect(mockDeepChat.validateInput!("  ab  ")).toBeFalse();
        expect(mockDeepChat.validateInput!("abc")).toBeTrue();
        expect(mockDeepChat.validateInput!("abcd")).toBeTrue();
    });
});
