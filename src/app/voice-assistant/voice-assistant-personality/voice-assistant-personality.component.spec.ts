import {ComponentFixture, TestBed} from "@angular/core/testing";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality.component";
import {VoiceAssistant} from "../../shared/types/voice-assistant";
import {VoiceAssistantService} from "../../shared/services/voice-assistant.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";

export class MockNgbModalRef {
    componentInstance = {
        prompt: undefined,
        title: undefined,
    };
    result: Promise<any> = new Promise((resolve) => resolve(true));
}

describe("VoiceAssistantPersonalityComponent", () => {
    let component: VoiceAssistantPersonalityComponent;
    let fixture: ComponentFixture<VoiceAssistantPersonalityComponent>;
    let voiceAssistantService: VoiceAssistantService;
    let modalService: NgbModal;
    const mockModalRef: MockNgbModalRef = new MockNgbModalRef();
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {},
                },
                {
                    provide: Router,
                    useValue: {
                        url: "localhost/voice-assistant/personality/1234",
                    },
                },
            ],
            imports: [
                HttpClientTestingModule,
                ReactiveFormsModule,
                RouterTestingModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceAssistantPersonalityComponent);
        TestBed.inject(ActivatedRoute);
        component = fixture.componentInstance;
        modalService = TestBed.inject(NgbModal);
        voiceAssistantService = TestBed.inject(VoiceAssistantService);
        voiceAssistantService.personalities = [
            new VoiceAssistant(
                "1234",
                "Testuser",
                "Male",
                0.8,
                "TestDescription",
            ),
        ];
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set a localStorage value after init", () => {
        component.ngOnInit();
        expect(localStorage.getItem("voice-assistant-tab")).toBe("personality");
    });

    it("should validate the modal form when calling formControlsValid", () => {
        component.personalityForm.patchValue({
            nameinput: "test",
            gender: "Male",
            pausethreshold: 0.5,
        });
        expect(component.personalityForm.valid).toBe(true);
        component.personalityForm.patchValue({
            nameinput: "1",
        });
        expect(component.personalityForm.valid).toBe(false);
        component.personalityForm.patchValue({
            nameinput: "test",
            gender: null,
        });
        expect(component.personalityForm.valid).toBe(false);
        component.personalityForm.patchValue({
            gender: "Male",
            pausethreshold: -3,
        });
        expect(component.personalityForm.valid).toBe(false);
        component.personalityForm.patchValue({
            pausethreshold: 0.8,
        });
        expect(component.personalityForm.valid).toBe(true);
    });

    it("should adjust the displayed thresholdString when calling adjustThreshold", () => {
        const spyOnAdjustThreshold = spyOn(
            component,
            "adjustThreshold",
        ).and.callThrough();
        component.personalityForm.patchValue({pausethreshold: 0.5});
        component.adjustThreshold("0.1");
        expect(spyOnAdjustThreshold).toHaveBeenCalled();
        expect(component.thresholdString).toBe("0.6s");
    });

    it("should show a modal when calling showModal", () => {
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        component.showModal();
        expect(spyOnShowModal).toHaveBeenCalled();
    });

    it("should set the formcontrols to defined values and open a modal when calling openAddModal", () => {
        const spyOnOpenAddModal = spyOn(
            component,
            "openAddModal",
        ).and.callThrough();
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        component.openAddModal();
        expect(component.personalityForm.controls["nameinput"].value).toBe("");
        expect(component.personalityForm.controls["gender"].value).toBe(
            "Female",
        );
        expect(component.personalityForm.controls["pausethreshold"].value).toBe(
            0.8,
        );
        expect(spyOnOpenAddModal).toHaveBeenCalled();
        expect(spyOnShowModal).toHaveBeenCalled();
    });

    it("should set the formcontrols to the values of the personality to be edited and open a modal when calling openEditModal", () => {
        const spyOnOpenEditModal = spyOn(
            component,
            "openEditModal",
        ).and.callThrough();
        const spyOnShowModal = spyOn(modalService, "open").and.returnValue(
            mockModalRef as any,
        );
        const spyOnGetPersonality = spyOn(
            voiceAssistantService,
            "getPersonality",
        ).and.returnValue(voiceAssistantService.personalities[0]);
        component.openEditModal();
        expect(spyOnGetPersonality).toHaveBeenCalled();
        expect(component.personalityForm.controls["nameinput"].value).toBe(
            "Testuser",
        );
        expect(component.personalityForm.controls["gender"].value).toBe("Male");
        expect(component.personalityForm.controls["pausethreshold"].value).toBe(
            0.8,
        );
        expect(spyOnOpenEditModal).toHaveBeenCalled();
        expect(spyOnShowModal).toHaveBeenCalled();
    });
});
