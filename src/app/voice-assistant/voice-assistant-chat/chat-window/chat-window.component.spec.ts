import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ChatWindowComponent} from "./chat-window.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {ChatMessage} from "src/app/shared/types/chat-message";
import {ReactiveFormsModule} from "@angular/forms";
import {Chat} from "src/app/shared/types/chat.class";

describe("ChatWindowComponent", () => {
    let component: ChatWindowComponent;
    let fixture: ComponentFixture<ChatWindowComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid: string}>;

    beforeEach(async () => {
        paramsSubject = new Subject<{chatUuid: string}>();

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj("ChatService", [
                "getChatMessagesObservable",
                "sendChatMessage",
                "getChat",
                "getIsListeningObservable",
            ]);
        await TestBed.configureTestingModule({
            declarations: [ChatWindowComponent],
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
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
            ],
        }).compileComponents();

        chatService = TestBed.inject(
            ChatService,
        ) as jasmine.SpyObj<ChatService>;

        fixture = TestBed.createComponent(ChatWindowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the correct observables and obtain its values from them", () => {
        const chatId = "chat-id";

        const messages = [
            {
                messageId: "message-id",
                timestamp: "yesterday",
                isUser: false,
                content: "hello world",
            },
        ];
        const messagesSubject = new Subject<ChatMessage[]>();
        chatService.getChatMessagesObservable.and.returnValue(messagesSubject);
        const isListeningSubject = new Subject<boolean>();
        chatService.getIsListeningObservable.and.returnValue(
            isListeningSubject,
        );

        paramsSubject.next({chatUuid: chatId});

        expect(chatService.getChatMessagesObservable).toHaveBeenCalledOnceWith(
            chatId,
        );
        expect(chatService.getIsListeningObservable).toHaveBeenCalledOnceWith(
            chatId,
        );

        messagesSubject.next(messages);
        expect(component.messages).toEqual(messages);

        isListeningSubject.next(true);
        expect(component.textInputActive).toBeFalse();
        component.chatMessageFormControl.setValue("non empty text");
        expect(component.textInputActive).toBeTrue();
        isListeningSubject.next(false);
        expect(component.textInputActive).toBeFalse();
        isListeningSubject.next(true);
        expect(component.textInputActive).toBeTrue();
        component.chatMessageFormControl.setValue("");
        expect(component.textInputActive).toBeFalse();
    });

    it("should send a chat-message and clear the input field", () => {
        const chatId = "c-id";
        const messageContent = "hello world";
        component.chat = new Chat("trees", "p-id", chatId);
        component.textInputActive = true;
        component.chatMessageFormControl.setValue(messageContent);
        chatService.sendChatMessage.and.returnValue(
            new BehaviorSubject(undefined),
        );

        component.sendChatMessage();

        expect(chatService.sendChatMessage).toHaveBeenCalledOnceWith(
            chatId,
            messageContent,
        );
        expect(component.chatMessageFormControl.value).toBe("");
    });

    it("should not send a chat message, if no chat is selected", () => {
        const messageContent = "hello world";
        component.chat = undefined;
        component.chatMessageFormControl.setValue(messageContent);

        component.sendChatMessage();

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(component.chatMessageFormControl.value).toBe(messageContent);
    });

    it("should not send a chat message, if text-input is not active", () => {
        const messageContent = "hello world";
        component.chat = new Chat("trees", "p-id", "c-id");
        component.chatMessageFormControl.setValue(messageContent);
        component.textInputActive = false;

        component.sendChatMessage();

        expect(chatService.sendChatMessage).not.toHaveBeenCalled();
        expect(component.chatMessageFormControl.value).toBe(messageContent);
    });
});
