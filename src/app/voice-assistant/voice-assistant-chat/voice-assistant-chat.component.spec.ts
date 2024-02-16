import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantChatComponent} from "./voice-assistant-chat.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, Observable, of} from "rxjs";
import {Chat} from "src/app/shared/types/chat.class";
import {ChatService} from "src/app/shared/services/chat.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {UtilService} from "src/app/shared/services/util.service";
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
    const mockModalRef: MockNgbModalRef = new MockNgbModalRef();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: Router,
                    useValue: {
                        url: "localhost/voice-assistant/personality/1234",
                    },
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
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
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        component.showModal();
        expect(spyOnShowModal).toHaveBeenCalled();
    });

    it("should show a modal when calling openAddModal", () => {
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        const spyOnAddModal = spyOn(
            component,
            "openAddModal",
        ).and.callThrough();
        component.topicFormControl.setValue("TEST");
        component.openAddModal();
        expect(spyOnShowModal).toHaveBeenCalled();
        expect(spyOnAddModal).toHaveBeenCalled();
        expect(component.topicFormControl.value).toBe("");
    });

    it("should show a modal when calling openEditModal", () => {
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        const spyOnEditModal = spyOn(
            component,
            "openEditModal",
        ).and.callThrough();
        const spyOnChat = spyOn(chatService, "getChat").and.returnValue(
            new Chat("TEST", "123", "123"),
        );
        component.openEditModal();
        expect(spyOnShowModal).toHaveBeenCalled();
        expect(spyOnEditModal).toHaveBeenCalled();
        expect(spyOnChat).toHaveBeenCalled();
        expect(component.topicFormControl.value).toBe("TEST");
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

    it("should delete a chat when calling deleteChat", () => {
        const spyOnDeleteChat = spyOn<ChatService, any>(
            chatService,
            "deleteChatById",
        ).and.callFake(() => chatService.deleteChat("123"));
        chatService.chats = [new Chat("1234", "1234", "1234")];
        component.deleteChat();
        expect(spyOnDeleteChat).toHaveBeenCalled();
        expect(chatService.chats.length).toBe(0);
    });
});
