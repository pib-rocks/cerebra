import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityDescriptionComponent} from "./personality-description.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BehaviorSubject, Subject} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {RouterTestingModule} from "@angular/router/testing";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right/voice-assistant-personality-sidebar-right.component";
import {VoiceAssistantNavComponent} from "../voice-assistant-nav/voice-assistant-nav.component";

describe("PersonalityDescriptionComponent", () => {
    let component: PersonalityDescriptionComponent;
    let fixture: ComponentFixture<PersonalityDescriptionComponent>;

    let voiceAssistantService: VoiceAssistantService;

    let fakePersonality: VoiceAssistant;

    // let personalitiesSubject: Subject<VoiceAssistant[]>;

    let router: Router;
    let paramsSubject: Subject<{personalityUuid: string}>;

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject({
            personalityUuid: "01234567-0123-0123-0123-0123456789ab",
        });
        const voiceAssistantServiceSpy: jasmine.SpyObj<VoiceAssistantService> =
            jasmine.createSpyObj("VoiceAssistantService", [
                "getPersonality",
                "updatePersonalityById",
                "deletePersonalityById",
                "getAllPersonalities",
            ]);
        // personalitiesSubject = new Subject();
        // voiceAssistantServiceSpy.getAllPersonalities.and.returnValue(personalitiesSubject)

        await TestBed.configureTestingModule({
            declarations: [
                VoiceAssistantNavComponent,
                VoiceAssistantPersonalitySidebarRightComponent,
            ],
            imports: [
                HttpClientTestingModule,
                FormsModule,
                RouterTestingModule,
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
                {
                    provice: VoiceAssistantService,
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
        }).compileComponents();
        voiceAssistantService = TestBed.inject(VoiceAssistantService);
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(PersonalityDescriptionComponent);
        component = fixture.componentInstance;
        fakePersonality = new VoiceAssistant(
            "1234",
            "fakePersonality",
            "Female",
            0.8,
            "Fake test personality",
        );
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

    // No Clone button in HTML right now -> Unit-Test dose not work...
    // it("should call cloneDescription when clicking on the clone-button", () => {
    //     const button: HTMLElement | null =
    //         document.getElementById("clone-button");
    //     const spyUpdateDescription = spyOn(component, "cloneDescription");
    //     button?.click();
    //     expect(spyUpdateDescription).toHaveBeenCalled();
    // });
});
