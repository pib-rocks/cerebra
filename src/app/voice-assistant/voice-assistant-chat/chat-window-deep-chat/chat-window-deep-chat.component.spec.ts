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
        onInput?: (body: {
            content?: {text?: string};
            isUser?: boolean;
        }) => void;
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

    describe("applyE2eHooks", () => {
        it("stamps legacy ids and data-test attributes onto input and button", () => {
            const root = document.createElement("div");
            const textarea = document.createElement("textarea");
            const button = document.createElement("button");
            root.appendChild(textarea);
            root.appendChild(button);

            (component as any).applyE2eHooks(root);

            expect(textarea.id).toBe("message-input");
            expect(textarea.getAttribute("data-test")).toBe(
                "TXT_Chat_Message",
            );
            expect(button.id).toBe("chat-send-button");
            expect(button.getAttribute("data-test")).toBe("BTN_Chat_Send");
        });

        it("does not throw when input or button is missing", () => {
            const empty = document.createElement("div");
            expect(() =>
                (component as any).applyE2eHooks(empty),
            ).not.toThrow();

            const inputOnly = document.createElement("div");
            inputOnly.appendChild(document.createElement("textarea"));
            expect(() =>
                (component as any).applyE2eHooks(inputOnly),
            ).not.toThrow();

            const buttonOnly = document.createElement("div");
            buttonOnly.appendChild(document.createElement("button"));
            expect(() =>
                (component as any).applyE2eHooks(buttonOnly),
            ).not.toThrow();
        });

        it("toggles disabled on the stamped button at the 2→3 character boundary", () => {
            const root = document.createElement("div");
            const textarea = document.createElement("textarea");
            const button = document.createElement("button");
            root.appendChild(textarea);
            root.appendChild(button);

            (component as any).smartConnectEnabled = true;
            (component as any).currentInputText = "";
            (component as any).applyE2eHooks(root);

            expect(button.hasAttribute("disabled")).toBeTrue();

            (component as any).currentInputText = "ab";
            (component as any).syncSubmitButtonDisabled();
            expect(button.hasAttribute("disabled")).toBeTrue();

            (component as any).currentInputText = "abc";
            (component as any).syncSubmitButtonDisabled();
            expect(button.hasAttribute("disabled")).toBeFalse();

            (component as any).currentInputText = "ab";
            (component as any).syncSubmitButtonDisabled();
            expect(button.hasAttribute("disabled")).toBeTrue();
        });

        it("mirrors the disabled state onto aria-disabled for non-form submit controls", () => {
            // deep-chat's real submit control (#submit-icon) is a div/svg, not a
            // <button>. Playwright's is_disabled() falls back to aria-disabled
            // for non-form elements, so both attributes must stay in sync.
            const root = document.createElement("div");
            const input = document.createElement("div");
            input.id = "text-input";
            const icon = document.createElement("div");
            icon.id = "submit-icon";
            root.appendChild(input);
            root.appendChild(icon);

            (component as any).smartConnectEnabled = true;
            (component as any).currentInputText = "ab";
            (component as any).applyE2eHooks(root);

            expect(icon.id).toBe("chat-send-button");
            expect(icon.getAttribute("data-test")).toBe("BTN_Chat_Send");
            expect(icon.getAttribute("aria-disabled")).toBe("true");

            (component as any).currentInputText = "abc";
            (component as any).syncSubmitButtonDisabled();
            expect(icon.getAttribute("aria-disabled")).toBe("false");
            expect(icon.hasAttribute("disabled")).toBeFalse();
        });

        it("keeps stamped button disabled when SmartConnect is off", () => {
            const root = document.createElement("div");
            const textarea = document.createElement("textarea");
            const button = document.createElement("button");
            root.appendChild(textarea);
            root.appendChild(button);

            (component as any).smartConnectEnabled = true;
            (component as any).currentInputText = "long enough";
            (component as any).applyE2eHooks(root);
            expect(button.hasAttribute("disabled")).toBeFalse();

            tokenStatusSubject.next({
                tokenExists: false,
                tokenActive: false,
            });
            expect(button.hasAttribute("disabled")).toBeTrue();
        });
    });
});
