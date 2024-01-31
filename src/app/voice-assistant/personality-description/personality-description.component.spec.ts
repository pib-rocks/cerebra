import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityDescriptionComponent} from "./personality-description.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {RouterTestingModule} from "@angular/router/testing";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";

describe("PersonalityDescriptionComponent", () => {
    let component: PersonalityDescriptionComponent;
    let fixture: ComponentFixture<PersonalityDescriptionComponent>;
    let voiceAssistantService: VoiceAssistantService;
    let fakePersonality: VoiceAssistant;
    let router: Router;
    const paramsSubject = new BehaviorSubject({
        personalityUuid: "01234567-0123-0123-0123-0123456789ab",
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PersonalityDescriptionComponent],
            imports: [
                HttpClientTestingModule,
                FormsModule,
                RouterTestingModule.withRoutes([]),
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            data: {
                                personality: "12345",
                            },
                        },
                        params: paramsSubject,
                    },
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(PersonalityDescriptionComponent);
        voiceAssistantService = TestBed.inject(VoiceAssistantService);
        router = TestBed.inject(Router);
        fakePersonality = new VoiceAssistant(
            "1234",
            "fakePersonality",
            "Female",
            0.8,
            "Fake test personality",
        );
        component = fixture.componentInstance;
        component.personality = new VoiceAssistant(
            "",
            "Test",
            "Male",
            0.3,
            "Testdesc2",
        );
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should call updateDescription when clicking on the save-button", () => {
        const button: HTMLElement | null =
            document.getElementById("save-button");
        const spyUpdateDescription = spyOn(component, "updateDescription");
        button?.click();
        expect(spyUpdateDescription).toHaveBeenCalled();
    });

    it("should call the next method in the va-service when updatePersonality is called", () => {
        const spyOnVoiceAssistantServiceUuidSubject = spyOn(
            voiceAssistantService.uuidSubject,
            "next",
        ).and.callFake(() => {
            return;
        });
        component.personality = fakePersonality;
        component.updatePersonality();
        expect(spyOnVoiceAssistantServiceUuidSubject).toHaveBeenCalled();
    });

    it("should change the description of the personality when calling updateDescription", () => {
        const spyUpdateDescription = spyOn(
            component,
            "updateDescription",
        ).and.callThrough();
        component.personality = new VoiceAssistant(
            "",
            "Test",
            "Male",
            0.3,
            "Testdesc2",
        );
        component.textAreaContent = "Testdesc2";
        component.updateDescription();
        expect(spyUpdateDescription).toHaveBeenCalled();
        expect(component.personality.description).toBe("Testdesc2");
    });

    it("should call the deletion method of voiceAssistantService when calling deletePersonality", () => {
        const spyOnVoiceAssistantServicedeletePersonalityById = spyOn(
            voiceAssistantService,
            "deletePersonalityById",
        ).and.callFake(() => {
            voiceAssistantService.personalities.pop();
        });
        spyOnProperty(router, "url").and.returnValue(
            "/voice-assistant/01234567-0123-0123-0123-0123456789ab",
        );
        fakePersonality.personalityId = "01234567-0123-0123-0123-0123456789ab";
        voiceAssistantService.personalities.push(fakePersonality);
        component.deletePersonality();
        expect(
            spyOnVoiceAssistantServicedeletePersonalityById,
        ).toHaveBeenCalled();
        expect(voiceAssistantService.personalities.length).toBe(0);
    });

    it("should call cloneDescription when clicking on the clone-button", () => {
        const button: HTMLElement | null =
            document.getElementById("clone-button");
        const spyUpdateDescription = spyOn(component, "cloneDescription");
        button?.click();
        expect(spyUpdateDescription).toHaveBeenCalled();
    });
});
