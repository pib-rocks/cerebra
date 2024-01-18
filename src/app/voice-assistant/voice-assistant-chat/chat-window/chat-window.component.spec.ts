import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ChatWindowComponent} from "./chat-window.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {ChatMessage} from "src/app/shared/ros-message-types/ChatMessage";

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
        const message: ChatMessage = {
            chat_id: "chat-id",
            message_id: "message-id",
            timestamp: "yesterday",
            is_user: false,
            content: "hello world",
        };
        const messagesObservableSpy = jasmine.createSpyObj(
            "message-observable",
            ["subscribe"],
        );
        messagesObservableSpy.subscribe.and.callFake((callback: any) =>
            callback([message]),
        );
        chatService.getChatMessagesObservable.and.returnValue(
            messagesObservableSpy,
        );
        paramsSubject.next({chatUuid: "chat-id"});
        expect(chatService.getChatMessagesObservable).toHaveBeenCalledOnceWith(
            "chat-id",
        );
        expect(messagesObservableSpy.subscribe).toHaveBeenCalledTimes(1);
        expect(component.messages).toBeDefined();
        expect(component.messages).toEqual([jasmine.objectContaining(message)]);
    });
});
