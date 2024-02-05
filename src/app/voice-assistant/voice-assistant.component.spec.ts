import {ComponentFixture, TestBed, waitForAsync} from "@angular/core/testing";

import {VoiceAssistantComponent} from "./voice-assistant.component";
import {ActivatedRoute, Router} from "@angular/router";
import {VoiceAssistantNavComponent} from "./voice-assistant-nav/voice-assistant-nav.component";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {BoolToOnOffPipe} from "../shared/pipes/bool-to-on-off-pipe.pipe";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../shared/types/voice-assistant";
import {BehaviorSubject, Subject} from "rxjs";
export class MockNgbModalRef {
    componentInstance = {
        prompt: undefined,
        title: undefined,
    };
    result: Promise<any> = Promise.resolve(true);
}
describe("VoiceAssistantComponent", () => {
    let component: VoiceAssistantComponent;
    let fixture: ComponentFixture<VoiceAssistantComponent>;
    let voiceAssistantService: jasmine.SpyObj<VoiceAssistantService>;
    let modalService: NgbModal;
    let router: Router;

    const mockModalRef: MockNgbModalRef = new MockNgbModalRef();

    beforeEach(async () => {
        const voiceAssistantServiceSpy = jasmine.createSpyObj(
            "VocieAssistantService",
            [
                "setVoiceAssistantState",
                "getSubject",
                "setVoiceAssistantState",
                "getPersonality",
                "createPersonality",
                "updatePersonalityById",
            ],
            {
                voiceAssistantStateObservable: new BehaviorSubject({
                    turnedOn: false,
                    chatId: "",
                }),
                uuidSubject: new BehaviorSubject({}),
                personalities: [],
            },
        );
        await TestBed.configureTestingModule({
            declarations: [
                VoiceAssistantComponent,
                VoiceAssistantNavComponent,
                BoolToOnOffPipe,
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {},
                },
                {
                    provide: VoiceAssistantService,
                    useValue: voiceAssistantServiceSpy,
                },
                {
                    provide: Router,
                    useValue: {
                        get url() {
                            return "/test-url";
                        },
                    },
                },
            ],
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule,
            ],
        }).compileComponents();
        voiceAssistantService = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        modalService = TestBed.inject(NgbModal);
        router = TestBed.inject(Router);

        fixture = TestBed.createComponent(VoiceAssistantComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should toggle if currently turned off and a chat is selected", waitForAsync(() => {
        component.voiceAssistantActivationToggle.setValue(false);
        const turnOnSpy = spyOn(
            component.voiceAssistantActivationToggle,
            "setValue",
        );
        const chatId = "8cb9f9af-8b17-4366-a14b-cdd78ae02de6";
        voiceAssistantService.setVoiceAssistantState.and.callFake(() => {
            (
                voiceAssistantService.voiceAssistantStateObservable as Subject<any>
            ).next({turnedOn: true, chatId: chatId});
            return new Subject();
        });
        const url =
            "/voice-assistant/90f46610-fa0a-42a6-98ef-52dea5913cc2/chat/" +
            chatId;
        const urlSpy = spyOnProperty(router, "url", "get").and.returnValue(url);
        component.toggleVoiceAssistant();
        expect(turnOnSpy).toHaveBeenCalledOnceWith(true);
        expect(urlSpy).toHaveBeenCalled();
        expect(
            voiceAssistantService.setVoiceAssistantState,
        ).toHaveBeenCalledOnceWith({turnedOn: true, chatId: chatId});
        expect(component.imgSrc).toEqual(
            "../../assets/toggle-switch-right.png",
        );
    }));

    it("should toggle if currently turned on", waitForAsync(() => {
        component.voiceAssistantActivationToggle.setValue(true);
        const turnOnSpy = spyOn(
            component.voiceAssistantActivationToggle,
            "setValue",
        );
        const chatId = "8cb9f9af-8b17-4366-a14b-cdd78ae02de6";
        const url =
            "/voice-assistant/90f46610-fa0a-42a6-98ef-52dea5913cc2/chat/" +
            chatId;
        voiceAssistantService.setVoiceAssistantState.and.callFake(() => {
            (
                voiceAssistantService.voiceAssistantStateObservable as Subject<any>
            ).next({turnedOn: false, chatId: chatId});
            return new Subject();
        });
        const urlSpy = spyOnProperty(router, "url", "get").and.returnValue(url);
        component.toggleVoiceAssistant();
        expect(turnOnSpy).toHaveBeenCalledOnceWith(false);
        expect(urlSpy).not.toHaveBeenCalled();
        expect(component.imgSrc).toEqual("../../assets/toggle-switch-left.png");
    }));

    it("should not toggle if currently turned off, but no chat is selected", waitForAsync(() => {
        component.voiceAssistantActivationToggle.setValue(false);
        const turnOnSpy = spyOn(
            component.voiceAssistantActivationToggle,
            "setValue",
        );
        const url = "/this-is-not-a-valid-url";
        const urlSpy = spyOnProperty(router, "url", "get").and.returnValue(url);
        expect(() => component.toggleVoiceAssistant()).toThrow(
            jasmine.any(Error),
        );
        expect(turnOnSpy).not.toHaveBeenCalled();
        expect(urlSpy).toHaveBeenCalled();
        expect(
            voiceAssistantService.setVoiceAssistantState,
        ).not.toHaveBeenCalled();
        expect(component.imgSrc).toEqual("../../assets/toggle-switch-left.png");
    }));

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
        component.openAddModal();
        expect(spyOnShowModal).toHaveBeenCalled();
        expect(spyOnAddModal).toHaveBeenCalled();
    });

    it("should show a modal when calling openEditModal", () => {
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        const spyOnEditModal = spyOn(
            component,
            "openEditModal",
        ).and.callThrough();
        voiceAssistantService.getPersonality.and.returnValue(
            new VoiceAssistant("123", "123", "123", 0.3),
        );
        voiceAssistantService.personalities.push(
            new VoiceAssistant("123", "123", "123", 0.3),
        );
        component.openEditModal("123");
        expect(spyOnShowModal).toHaveBeenCalled();
        expect(spyOnEditModal).toHaveBeenCalled();
        expect(voiceAssistantService.getPersonality).toHaveBeenCalled();
        expect(component.personalityForm.controls["name-input"].value).toBe(
            "123",
        );
    });

    it("should call editPersonality or addPersonality when savePersonality is called", () => {
        const spyOnEditPersonality = spyOn(
            component,
            "editPersonality",
        ).and.callFake(() => {
            return;
        });
        const spyOnAddPersonality = spyOn(
            component,
            "addPersonality",
        ).and.callFake(() => {
            return;
        });
        const spyOnSavePersonality = spyOn(
            component,
            "savePersonality",
        ).and.callThrough();
        component.personalityForm.patchValue({
            "name-input": "Test",
            gender: "Female",
            pausethreshold: 0.4,
        });
        component.uuid = undefined;
        component.savePersonality();
        expect(spyOnAddPersonality).toHaveBeenCalled();
        component.uuid = "123";
        component.savePersonality();
        expect(spyOnEditPersonality).toHaveBeenCalled();
        expect(spyOnSavePersonality).toHaveBeenCalled();
    });
});
