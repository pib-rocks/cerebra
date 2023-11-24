import {TestBed} from "@angular/core/testing";

import {ChatService} from "./chat.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ApiService} from "./api.service";
import {Chat} from "../types/chat.class";
import {BehaviorSubject, map, of} from "rxjs";

describe("ChatService", () => {
    let service: ChatService;
    let apiService: ApiService;
    const testChat0 = new Chat("Pib0", "12345", "54321");
    const testChat1 = new Chat("Pib1", "12345", "54322");
    const testChat2 = new Chat("Pib2", "12345", "54323");
    const testChat0Subject = new BehaviorSubject<Chat>(testChat0);
    const testChatAllSubject = new BehaviorSubject<Chat[]>([
        testChat0,
        testChat1,
        testChat2,
    ]);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(ChatService);
        apiService = TestBed.inject(ApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should return all chats from database when calling getAllChats", () => {
        const spyOnGetAllChats = spyOn(apiService, "get").and.returnValue(
            testChatAllSubject.pipe(
                map((m) => {
                    return {voiceAssistantChats: m};
                }),
            ),
        );
        service.getAllChats();
        expect(spyOnGetAllChats).toHaveBeenCalled();
        expect(service.chatSubject.getValue().length).toEqual(3);
        expect(service.chats.length).toBe(3);
    });

    it("should return a created chat form db when calling createChat", () => {
        const spyOnCreateChat = spyOn(apiService, "post").and.returnValue(
            testChat0Subject,
        );
        service.createChat(testChat0);
        const index = service.chats.findIndex(
            (i) => i.chatId === testChat0.chatId,
        );
        expect(spyOnCreateChat).toHaveBeenCalled();
        expect(service.chats[index]).toEqual(testChat0);
    });

    it("should return a chat identified by chatId when calling getChatById", () => {
        const spyOnGet = spyOn(apiService, "get").and.returnValue(
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
        expect(spyOnGet).toHaveBeenCalled();
        expect(spyOnGetChatById).toHaveBeenCalled();
        expect(spyOnAddChat).toHaveBeenCalled();
        expect(service.chats[0].chatId).toBe("54321");
    });

    it("should delete a chat from its chat-array when calling deleteChatById", () => {
        const spyOnDelete = spyOn(apiService, "delete").and.returnValue(of({}));
        const spyOnDeleteChat = spyOn(service, "deleteChat").and.callThrough();
        service.chats = [testChat0, testChat1, testChat2];
        service.deleteChatById("54321");
        expect(spyOnDelete).toHaveBeenCalled();
        expect(spyOnDeleteChat).toHaveBeenCalled();
        expect(service.chats.length).toBe(2);
    });

    it("should update a chat from its chat-array when calling updateChatById", () => {
        const spyOnPut = spyOn(apiService, "put").and.returnValue(
            of(new Chat("NewName", "12345", "54321")),
        );
        const spyOnEditChat = spyOn(service, "editChat").and.callThrough();
        service.chats = [testChat0];
        service.updateChatById(new Chat("NewName", "12345", "54321"));
        expect(spyOnPut).toHaveBeenCalled();
        expect(spyOnEditChat).toHaveBeenCalled();
    });

    it("should return a chat or undefined when calling getChat", () => {
        service.chats = [testChat0, testChat1, testChat2];
        let result: Chat | undefined = service.getChat("54321");
        expect(result?.chatId).toBe("54321");
        expect(result?.personalityId).toBe("12345");
        expect(result?.topic).toBe("Pib0");
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
});
