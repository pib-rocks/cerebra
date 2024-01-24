import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantComponent} from "./voice-assistant.component";
import {ActivatedRoute} from "@angular/router";
import {VoiceAssistantNavComponent} from "./voice-assistant-nav/voice-assistant-nav.component";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {BoolToOnOffPipe} from "../shared/pipes/bool-to-on-off-pipe.pipe";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../shared/types/voice-assistant";
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
    let voiceAssistantService: VoiceAssistantService;
    let modalService: NgbModal;

    const mockModalRef: MockNgbModalRef = new MockNgbModalRef();

    beforeEach(async () => {
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
            ],
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule,
            ],
        }).compileComponents();
        voiceAssistantService = TestBed.inject(VoiceAssistantService);
        modalService = TestBed.inject(NgbModal);

        fixture = TestBed.createComponent(VoiceAssistantComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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
        const spyOnChat = spyOn(
            voiceAssistantService,
            "getPersonality",
        ).and.returnValue(new VoiceAssistant("123", "123", "123", 0.3));
        voiceAssistantService.personalities = [
            new VoiceAssistant("123", "123", "123", 0.3),
        ];
        component.openEditModal("123");
        expect(spyOnShowModal).toHaveBeenCalled();
        expect(spyOnEditModal).toHaveBeenCalled();
        expect(spyOnChat).toHaveBeenCalled();
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
