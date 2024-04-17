import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ChatWindowComponent} from "./chat-window.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {ChatMessage} from "src/app/shared/ros-types/msg/chat-message";
import {ReactiveFormsModule} from "@angular/forms";

fdescribe("ChatWindowComponent", () => {
    let component: ChatWindowComponent;
    let fixture: ComponentFixture<ChatWindowComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let paramsSubject: Subject<{chatId: string}>;

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject<{chatId: string}>({chatId: ""});

        const chatServiceSpy: jasmine.SpyObj<ChatService> =
            jasmine.createSpyObj("chat-service", [
                "getChatMessagesObservable",
                "getIsActiveObservable",
                "getIsListeningObservable",
                "getChat",
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
        paramsSubject.next({chatId: "chat-id"});
        expect(chatService.getChatMessagesObservable).toHaveBeenCalledOnceWith(
            "chat-id",
        );
        expect(messagesObservableSpy.subscribe).toHaveBeenCalledTimes(1);
        expect(component.messages).toBeDefined();
        expect(component.messages).toEqual([jasmine.objectContaining(message)]);
    });

    it("should get the correct is-active observable and obtain its active-status from it", () => {
        const isActiveSubject = new Subject<boolean>();
        chatService.getIsActiveObservable.and.returnValue(isActiveSubject);
        paramsSubject.next({chatId: "chat-id"});
        expect(chatService.getIsActiveObservable).toHaveBeenCalledOnceWith(
            "chat-id",
        );
        expect(component.active).toBeFalse();
        isActiveSubject.next(true);
        expect(component.active).toBeTrue();
    });
});
