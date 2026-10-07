import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantChatComponent} from "./voice-assistant-chat.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, of, Subject} from "rxjs";
import {Chat} from "src/app/shared/types/chat.class";
import {ChatService} from "src/app/shared/services/chat.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    ActivatedRoute,
    convertToParamMap,
    NavigationExtras,
    Router,
} from "@angular/router";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {RouterTestingModule} from "@angular/router/testing";
import {SideBarRightComponent} from "src/app/ui-components/sidebar-right/sidebar-right.component";
import {TokenService} from "src/app/shared/services/token.service";
import {DEGRADED_MODE} from "src/app/system/keys/key-store-session";
import {KeyStoreSessionService} from "src/app/system/keys/key-store-session.service";
export class MockNgbModalRef {
    componentInstance = {
        prompt: undefined,
        title: undefined,
    };
    result: Promise<any> = Promise.resolve(true);
}

describe("VoiceAssistantChatComponent", () => {
    let component: VoiceAssistantChatComponent;
    let fixture: ComponentFixture<VoiceAssistantChatComponent>;
    let chatService: ChatService;
    let modalService: NgbModal;
    let tokenStatusSubject: Subject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>;

    beforeEach(async () => {
        const modalServiceSpy: jasmine.SpyObj<NgbModal> = jasmine.createSpyObj(
            NgbModal,
            ["open"],
        );
        tokenStatusSubject = new Subject();
        const tokenServiceMock = jasmine.createSpyObj(
            "TokenService",
            ["checkTokenExists"],
            {tokenStatus$: tokenStatusSubject.asObservable()},
        );
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbModal,
                    useValue: modalServiceSpy,
                },
                {
                    provide: Router,
                    useValue: {
                        //Need this navigate for the right-sidebar-component (mock of "this.router.navigate([uuid ?? "."], {relativeTo: this.route});")
                        navigate: (
                            _commands: any[],
                            _extras?: NavigationExtras,
                        ) => {
                            return new Promise((_resolve, _reject) => {
                                return true;
                            });
                        },
                        url: "localhost/voice-assistant/personality/1234",
                    },
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(
                            convertToParamMap({personalityUuid: "1234"}),
                        ),
                        snapshot: {
                            params: {
                                personality: new VoiceAssistant(
                                    "1234",
                                    "Test",
                                    "Female",
                                    0.8,
                                    "Testdescription",
                                ),
                            },
                        },
                    },
                },
                {
                    provide: TokenService,
                    useValue: tokenServiceMock,
                },
            ],
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                FormsModule,
                HttpClientTestingModule,
                VoiceAssistantChatComponent,
                SideBarRightComponent,
            ],
        }).compileComponents();
        chatService = TestBed.inject(ChatService);
        modalService = TestBed.inject(NgbModal);
        chatService.chatSubject = new BehaviorSubject<Chat[]>([
            new Chat("Testtopic0", "123", "123"),
        ]);
        localStorage.setItem("personality", "123");
        fixture = TestBed.createComponent(VoiceAssistantChatComponent);
        TestBed.inject(ActivatedRoute);
        TestBed.inject(Router);
        component = fixture.componentInstance;
        component.subject = chatService.getSubject("123");
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should initialize component correctly on ngOnInit", () => {
        component.ngOnInit();

        expect(localStorage.getItem("voice-assistant-tab")).toBe("chat");
    });

    it("should show a modal when calling showModal", () => {
        const spyOnAddModal = spyOn(component, "showModal").and.callThrough();
        component.showModal();
        expect(spyOnAddModal).toHaveBeenCalled();
        expect(modalService.open).toHaveBeenCalled();
    });

    it("should show a modal when calling openAddModal", () => {
        const spyOnAddModal = spyOn(
            component,
            "openAddModal",
        ).and.callThrough();
        component.openAddModal();
        component.topicFormControl.setValue("TEST");
        component.openAddModal();
        expect(spyOnAddModal).toHaveBeenCalled();
        expect(modalService.open).toHaveBeenCalled();
        expect(component.topicFormControl.value).toBe("");
    });

    it("should add a chat when calling addChat", () => {
        const spyOnAddChat = spyOn(component, "addChat").and.callThrough();
        const spyOnCreateChat = spyOn(chatService, "createChat").and.callFake(
            () => {
                chatService.chats.push(new Chat("TestValue", "123", "123"));
                return of(new Chat("TestValue", "123", "123"));
            },
        );
        component.topicFormControl.setValue("TestValue");
        component.personalityId = "1234";
        component.addChat();
        expect(spyOnAddChat).toHaveBeenCalled();
        expect(spyOnCreateChat).toHaveBeenCalled();
        expect(
            chatService.chats.find((m) => m.topic === "TestValue"),
        ).not.toBeUndefined();
    });

    it("refuses to start a chat or the voice when the model row is gone", () => {
        const service = TestBed.inject(VoiceAssistantService);
        const gone = new VoiceAssistant(
            "1234",
            "Ada",
            "Female",
            0.8,
            "",
            null,
            10,
            "12",
        );
        gone.needsNewModel = true;
        service.personalities = [gone];
        component.personalityId = gone.personalityId;
        component.personality = gone;
        const create = spyOn(chatService, "createChat");
        component.topicFormControl.setValue("Removed");
        component.addChat();
        expect(create).not.toHaveBeenCalled();

        const start = spyOn(service, "setVoiceAssistantState").and.returnValue(
            of(undefined),
        );
        const router = TestBed.inject(Router);
        const previous = Object.getOwnPropertyDescriptor(router, "url");
        Object.defineProperty(router, "url", {
            configurable: true,
            get: () =>
                "/voice-assistant/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/chat/ffffffff-1111-2222-3333-444444444444",
        });
        component.voiceAssistantActivationToggle.setValue(false);
        component.toggleVoiceAssistant();
        expect(start).not.toHaveBeenCalled();
        expect(component.turnedOn).toBeFalse();
        if (previous != null) {
            Object.defineProperty(router, "url", previous);
        }
    });

    it("should edit a chat when calling editChat", () => {
        const spyOnEditChat = spyOn(component, "editChat").and.callThrough();
        const spyOnGetChat = spyOn(chatService, "getChat").and.returnValue(
            new Chat("TestValue", "123", "123"),
        );
        const spyOnUpdateChat = spyOn(
            chatService,
            "updateChatById",
        ).and.returnValue(of(new Chat("TestValue", "123", "123")));
        component.uuid = "123;";
        component.topicFormControl.setValue("UpdatedValue");
        component.editChat();
        expect(spyOnEditChat).toHaveBeenCalled();
        expect(spyOnGetChat).toHaveBeenCalled();
        expect(spyOnUpdateChat).toHaveBeenCalled();
        expect(component.uuid).toBeUndefined();
    });

    it("should call editChat or addChat when saveChat is called", () => {
        const spyOnEditChat = spyOn(component, "editChat").and.callFake(() => {
            return;
        });
        const spyOnAddChat = spyOn(component, "addChat").and.callFake(() => {
            return;
        });
        const spyOnSaveChat = spyOn(component, "saveChat").and.callThrough();
        component.topicFormControl.setValue("Test");
        component.uuid = undefined;
        component.saveChat();
        expect(spyOnAddChat).toHaveBeenCalled();
        component.uuid = "123";
        component.saveChat();
        expect(spyOnEditChat).toHaveBeenCalled();
        expect(spyOnSaveChat).toHaveBeenCalled();
    });

    it("should disable deleteChat when only one chat exists per personality", () => {
        component.personalityId = "1234";
        const chats = [
            new Chat("Test1", "1234", "1234"),
            new Chat("Test2", "123", "1234"),
        ];
        const deleteChat = component.dropdownCallbackMethods.find(
            (e) => e.label === "Delete chat",
        );
        component.toggleDeleteChat(chats);
        expect(deleteChat!.disabled).toBeTrue();
    });

    it("should not disable deleteChat when more than one chat exists per personality", () => {
        component.personalityId = "1234";
        component.turnedOn = false;
        const chats = [
            new Chat("Test1", "1234", "1234"),
            new Chat("Test2", "1234", "1234"),
        ];
        const deleteChat = component.dropdownCallbackMethods.find(
            (e) => e.label === "Delete chat",
        );
        component.toggleDeleteChat(chats);
        expect(deleteChat!.disabled).toBeFalse();
    });

    it("should disable deleteChat when voice assistant is active", () => {
        component.personalityId = "1234";
        component.turnedOn = true;
        const chats = [
            new Chat("Test1", "1234", "1234"),
            new Chat("Test2", "1234", "1234"),
        ];
        const deleteChat = component.dropdownCallbackMethods.find(
            (e) => e.label === "Delete chat",
        );
        component.toggleDeleteChat(chats);
        expect(deleteChat!.disabled).toBeTrue();
    });

    it("records that a cloud token is stored", () => {
        tokenStatusSubject.next({
            tokenExists: true,
            tokenActive: true,
        });
        expect(component.cloudTokenStored).toBeTrue();
    });

    it("records that no cloud token is stored", () => {
        tokenStatusSubject.next({tokenExists: false, tokenActive: false});

        expect(component.cloudTokenStored).toBeFalse();
    });

    it("should set smartConnectActive to true when token is active", () => {
        tokenStatusSubject.next({
            tokenExists: true,
            tokenActive: true,
        });
        expect(component.smartConnectActive).toBeTrue();
    });

    it("should set smartConnectActive to false when token is inactive", () => {
        tokenStatusSubject.next({tokenExists: true, tokenActive: false});

        expect(component.smartConnectActive).toBeFalse();
    });

    it("keeps local voice available in degraded mode", () => {
        const session = TestBed.inject(KeyStoreSessionService);
        session.cancel();
        tokenStatusSubject.next({tokenExists: true, tokenActive: true});
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector(
            "#sidebar-right-toggle-voice-assistant",
        ) as HTMLButtonElement;
        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();
        expect(component.localVoiceEnabled()).toBeTrue();
        expect(button.disabled).toBeFalse();
    });

    it("shows the voice interaction switch and moves between text and audio conversation", () => {
        const service = TestBed.inject(VoiceAssistantService);
        const setState = spyOn(
            service,
            "setVoiceAssistantState",
        ).and.returnValue(of(undefined));
        const router = TestBed.inject(Router);
        const previous = Object.getOwnPropertyDescriptor(router, "url");
        const chatId = "ffffffff-1111-2222-3333-444444444444";
        Object.defineProperty(router, "url", {
            configurable: true,
            get: () =>
                `/voice-assistant/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/chat/${chatId}`,
        });
        tokenStatusSubject.next({tokenExists: true, tokenActive: true});
        component.voiceAssistantActivationToggle.setValue(false);
        component.turnedOn = false;
        fixture.detectChanges();

        const label = fixture.nativeElement.querySelector(
            "label.p-1",
        ) as HTMLLabelElement;
        const icons = fixture.nativeElement.querySelectorAll(
            "img.microphone-icon",
        );
        const button = fixture.nativeElement.querySelector(
            "#sidebar-right-toggle-voice-assistant",
        ) as HTMLButtonElement;
        const switchImage = button.querySelector("img") as HTMLImageElement;

        expect(label.textContent?.trim()).toBe("Voice interaction");
        expect(icons[0].getAttribute("src")).toContain(
            "voice_interaction_off.svg",
        );
        expect(icons[1].getAttribute("src")).toContain(
            "voice_interaction_on.svg",
        );
        expect(button.disabled).toBeFalse();
        expect(switchImage.src).toContain("toggle-switch-left.png");

        button.click();
        fixture.detectChanges();

        expect(setState).toHaveBeenCalledWith({turnedOn: true, chatId});
        expect(component.turnedOn).toBeTrue();
        expect(switchImage.src).toContain("toggle-switch-right.png");

        component.voiceAssistantActivationToggle.setValue(true);
        button.click();
        fixture.detectChanges();

        expect(setState).toHaveBeenCalledWith({turnedOn: false, chatId: ""});
        expect(component.turnedOn).toBeFalse();
        expect(switchImage.src).toContain("toggle-switch-left.png");
        if (previous != null) {
            Object.defineProperty(router, "url", previous);
        }
    });
});
