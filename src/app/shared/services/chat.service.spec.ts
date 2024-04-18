import {TestBed, waitForAsync} from "@angular/core/testing";

import {ChatService} from "./chat.service";
import {ApiService} from "./api.service";
import {Chat} from "../types/chat.class";
import {BehaviorSubject, Observable, Subject, map, of} from "rxjs";
import {ChatMessage} from "../types/chat-message";
import {ChatMessage as ChatMessageRos} from "../ros-types/msg/chat-message";
import {RosService} from "./ros-service/ros.service";
import {ChatIsListening} from "../ros-types/msg/chat-is-listening";

describe("ChatService", () => {
    let service: ChatService;
    let apiService: jasmine.SpyObj<ApiService>;
    let rosService: jasmine.SpyObj<RosService>;
    const testChat0 = new Chat("Pib0", "12345", "54321");
    const testChat1 = new Chat("Pib1", "12345", "54322");
    const testChat2 = new Chat("Pib2", "12345", "54323");
    const testChat0Subject = new BehaviorSubject<Chat>(testChat0);
    const testChatAllSubject = new BehaviorSubject<Chat[]>([
        testChat0,
        testChat1,
        testChat2,
    ]);
    let chatMessageReceiver$: Subject<ChatMessageRos>;
    let voiceAssistantChatIsListeningReceiver$: Subject<ChatIsListening>;

    beforeEach(() => {
        const rosServiceSpy: jasmine.SpyObj<RosService> = jasmine.createSpyObj(
            "RosService",
            ["sendChatMessage", "getChatIsListening"],
            {
                chatMessageReceiver$: new Subject(),
            },
        );
        chatMessageReceiver$ = new Subject();
        rosServiceSpy.chatMessageReceiver$ = chatMessageReceiver$;
        voiceAssistantChatIsListeningReceiver$ = new Subject();
        rosServiceSpy.chatIsListeningReceiver$ =
            voiceAssistantChatIsListeningReceiver$;

        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            "ApiService",
            ["get", "delete", "put", "post"],
        );
        apiServiceSpy.get.and.returnValue(
            new BehaviorSubject({voiceAssistantChats: []}),
        );

        TestBed.configureTestingModule({
            providers: [
                ChatService,
                {
                    provide: RosService,
                    useValue: rosServiceSpy,
                },
                {
                    provide: ApiService,
                    useValue: apiServiceSpy,
                },
            ],
        });
        service = TestBed.inject(ChatService);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;

        apiService.get = jasmine.createSpy();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should get the messages for the provided chat id", waitForAsync(() => {
        const message: ChatMessage = {
            messageId: "message_id",
            timestamp: "tomorrow",
            isUser: false,
            content: "world",
        };
        apiService.get.and.returnValue(
            new BehaviorSubject({messages: [message]}),
        );
        const result = service.getMessagesByChatId("chat-id");
        expect(apiService.get).toHaveBeenCalledOnceWith(
            "/voice-assistant/chat/chat-id/messages",
        );
        result.subscribe((messages) => {
            expect(messages).toEqual([jasmine.objectContaining(message)]);
        });
    }));

    it("should create a chat message", waitForAsync(() => {
        const message: ChatMessage = {
            messageId: "message_id",
            timestamp: "tomorrow",
            isUser: false,
            content: "world",
        };
        apiService.post.and.returnValue(new BehaviorSubject(message));
        const result = service.createChatMessage("chat-id", "test-content");
        expect(apiService.post).toHaveBeenCalledOnceWith(
            "/voice-assistant/chat/chat-id/messages",
            jasmine.objectContaining({
                content: "test-content",
                isUser: true,
            }),
        );
        result.subscribe((message) => {
            expect(message).toEqual(jasmine.objectContaining(message));
        });
    }));

    it("should return the already existing chat-message-observable", () => {
        const expectedObservable = new BehaviorSubject<ChatMessage[]>([]);
        const getObservableSpy = spyOn(
            service["messagesSubjectFromChatId"],
            "get",
        ).and.returnValue(expectedObservable);
        const result = service.getChatMessagesObservable("chat-id");
        expect(result).toBe(expectedObservable);
        expect(getObservableSpy).toHaveBeenCalledOnceWith("chat-id");
    });

    it("should create a new observable and return it", () => {
        const message: ChatMessage = {
            messageId: "message_id",
            timestamp: "tomorrow",
            isUser: false,
            content: "world",
        };
        const getObservableSpy = spyOn(
            service["messagesSubjectFromChatId"],
            "get",
        ).and.returnValue(undefined);
        const setObservableSpy = spyOn(
            service["messagesSubjectFromChatId"],
            "set",
        );
        spyOn(service, "getMessagesByChatId").and.returnValue(
            new BehaviorSubject([message]),
        );
        const result = service.getChatMessagesObservable("chat-id");
        expect(setObservableSpy).toHaveBeenCalledOnceWith(
            "chat-id",
            result as BehaviorSubject<ChatMessage[]>,
        );
        expect(getObservableSpy).toHaveBeenCalledOnceWith("chat-id");
        expect((result as BehaviorSubject<ChatMessage[]>).value).toEqual([
            message,
        ]);
    });

    it("should return all chats from database when calling getAllChats", () => {
        apiService.get.and.returnValue(
            testChatAllSubject.pipe(
                map((m) => {
                    return {voiceAssistantChats: m};
                }),
            ),
        );
        service.getAllChats();
        expect(apiService.get).toHaveBeenCalled();
        expect(service.chatSubject.getValue().length).toEqual(3);
        expect(service.chats.length).toBe(3);
    });

    it("should return a created chat form db when calling createChat", () => {
        apiService.post.and.returnValue(testChat0Subject);
        service.createChat(testChat0);
        const index = service.chats.findIndex(
            (i) => i.chatId === testChat0.chatId,
        );
        expect(apiService.post).toHaveBeenCalled();
        expect(service.chats[index]).toEqual(testChat0);
    });

    it("should return a chat identified by chatId when calling getChatById", () => {
        apiService.get.and.returnValue(
            testChatAllSubject.pipe(
                map((m) => m.filter((n) => n.chatId === "54321")),
            ),
        );
        const spyOnGetChatById = spyOn(
            service,
            "getChatById",
        ).and.callThrough();
        const spyOnAddChat = spyOn(service, "addChat").and.callFake(() =>
            service.chats.push(testChat0),
        );
        service.getChatById("54321");
        expect(service.chats.length).toBe(1);
        expect(apiService.get).toHaveBeenCalled();
        expect(spyOnGetChatById).toHaveBeenCalled();
        expect(spyOnAddChat).toHaveBeenCalled();
        expect(service.chats[0].chatId).toBe("54321");
    });

    it("should delete a chat from its chat-array when calling deleteChatById", () => {
        apiService.delete.and.returnValue(of({}));
        const spyOnDeleteChat = spyOn(service, "deleteChat").and.callThrough();
        service.chats = [testChat0, testChat1, testChat2];
        service.deleteChatById("54321");
        expect(apiService.delete).toHaveBeenCalled();
        expect(spyOnDeleteChat).toHaveBeenCalled();
        expect(service.chats.length).toBe(2);
    });

    it("should update a chat from its chat-array when calling updateChatById", () => {
        apiService.put.and.returnValue(
            of(new Chat("NewName", "12345", "54321")),
        );
        const spyOnEditChat = spyOn(service, "editChat").and.callThrough();
        service.chats = [testChat0];
        service.updateChatById(new Chat("NewName", "12345", "54321"));
        expect(apiService.put).toHaveBeenCalled();
        expect(spyOnEditChat).toHaveBeenCalled();
    });

    it("should return a chat or undefined when calling getChat", () => {
        service.chats = [testChat0, testChat1, testChat2];
        let result: Chat | undefined = service.getChat("54321");
        expect(result).toEqual(testChat0);
        result = service.getChat("undefinedTestId");
        expect(result).toBeFalsy();
    });

    it("should delete a chat and emit a new chatarray when calling deleteChat", () => {
        service.chats = [testChat0, testChat1, testChat2];
        service.chatSubject = new BehaviorSubject<Chat[]>({...service.chats});
        const spyOnChatSubjectNext = spyOn(service.chatSubject, "next");
        service.deleteChat("12345");
        expect(service.chats.length).toBe(2);
        expect(spyOnChatSubjectNext).toHaveBeenCalled();
    });

    it("should add a chat and emit a new chatarray when calling addChat", () => {
        service.chats = [testChat0, testChat1];
        service.chatSubject = new BehaviorSubject<Chat[]>({...service.chats});
        const spyOnChatSubjectNext = spyOn(service.chatSubject, "next");
        service.addChat(testChat2);
        expect(service.chats.length).toBe(3);
        expect(spyOnChatSubjectNext).toHaveBeenCalled();
    });

    it("should return the subject when calling getSubject", () => {
        service.chats = [
            new Chat("Testname0", "123", "00"),
            new Chat("Testname1", "123", "01"),
            new Chat("Testname2", "123", "02"),
            new Chat("Testname3", "123", "03"),
            new Chat("Testname4", "123", "04"),
            new Chat("Testname0", "321", "05"),
            new Chat("Testname1", "321", "06"),
            new Chat("Testname2", "321", "07"),
            new Chat("Testname3", "321", "08"),
            new Chat("Testname4", "321", "09"),
        ];
        const subject = service.getSubject("123");
        expect(subject).toBeTruthy();
        service.chatSubject.next(service.chats);
        subject.subscribe((sidebarElements) => {
            sidebarElements.forEach((chat) =>
                expect((chat as Chat).personalityId).toBe("123"),
            );
            expect(sidebarElements.length).toBe(5);
        });
    });

    it("should send a chat message", () => {
        const observable = new Observable<void>();
        const chatId = "test-id";
        const content = "some-content";
        rosService.sendChatMessage.and.returnValue(observable);
        expect(service.sendChatMessage(chatId, content)).toBe(observable);
        expect(rosService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            content,
        );
    });

    it("should get the correct listening-state if no inital status was published yet", () => {
        const chatId = "test-id";
        const next = jasmine.createSpy();
        rosService.getChatIsListening.and.returnValue(
            new BehaviorSubject(true),
        );
        service.getIsListeningObservable(chatId).subscribe({next});
        expect(rosService.getChatIsListening).toHaveBeenCalledOnceWith(chatId);
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: chatId,
            listening: false,
        });
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: chatId,
            listening: true,
        });
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: "other-chat-id",
            listening: true,
        });
        expect(next.calls.allArgs()).toEqual([[true], [false], [true]]);
    });

    it("should get the correct listening-state if an inital status was already published", () => {
        const chatId = "test-id";
        const next = jasmine.createSpy();
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: chatId,
            listening: true,
        });
        service.getIsListeningObservable(chatId).subscribe({next});
        expect(rosService.getChatIsListening).not.toHaveBeenCalled();
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: chatId,
            listening: false,
        });
        voiceAssistantChatIsListeningReceiver$.next({
            chat_id: "other-chat-id",
            listening: true,
        });
        expect(next.calls.allArgs()).toEqual([[true], [false]]);
    });
});
