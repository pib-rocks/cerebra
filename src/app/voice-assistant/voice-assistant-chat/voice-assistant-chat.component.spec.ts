import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantChatComponent} from "./voice-assistant-chat.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, Observable, of} from "rxjs";
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
import {RouterTestingModule} from "@angular/router/testing";
import {SideBarRightComponent} from "src/app/ui-components/sidebar-right/sidebar-right.component";
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

    beforeEach(async () => {
        const modalServiceSpy: jasmine.SpyObj<NgbModal> = jasmine.createSpyObj(
            NgbModal,
            ["open"],
        );
        await TestBed.configureTestingModule({
            declarations: [VoiceAssistantChatComponent, SideBarRightComponent],
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
                            commands: any[],
                            extras?: NavigationExtras,
                        ) => {
                            return new Promise((resolve, reject) => {
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
            ],
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                FormsModule,
                HttpClientTestingModule,
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

    it("should set a localStorage value after init", () => {
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
});
