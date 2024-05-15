import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ChatWindowComponent} from "./chat-window.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {ChatMessage} from "src/app/shared/types/chat-message";

describe("ChatWindowComponent", () => {
    let component: ChatWindowComponent;
    let fixture: ComponentFixture<ChatWindowComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatUuid: string}>;

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject<{chatUuid: string}>({chatUuid: ""});

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj(ChatService, [
                "getChatMessagesObservable",
                "getChat",
            ]);
        await TestBed.configureTestingModule({
            declarations: [ChatWindowComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
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

    it("should get the correct chat-message observable and obtain its messages from it", () => {
        const firstMessage: ChatMessage = {
            messageId: "message-id",
            timestamp: "yesterday",
            isUser: false,
            content: "hello world",
        };
        const secondMessage: ChatMessage = {
            messageId: "message-id",
            timestamp: "today",
            isUser: false,
            content: "hello world",
        };
        const messagesSubject = new Subject<ChatMessage[]>();
        chatService.getChatMessagesObservable.and.returnValue(messagesSubject);
        paramsSubject.next({chatUuid: "chat-id"});
        messagesSubject.next([firstMessage, secondMessage]);
        expect(component.messages).toBeDefined();
        expect(component.messages).toEqual([secondMessage, firstMessage]);
    });
});
