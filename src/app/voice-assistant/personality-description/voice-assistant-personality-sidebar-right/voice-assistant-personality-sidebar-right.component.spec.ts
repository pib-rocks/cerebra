import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, Subject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right.component";
import {
    FormGroup,
    FormControl,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {VoiceAssistantService} from "../../../shared/services/voice-assistant.service";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {TokenService} from "src/app/shared/services/token.service";
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";
import {DIRECT_CHANNEL} from "src/app/shared/types/channel-router";
import {retiredModelNotice} from "src/app/shared/types/provider-registry";

describe("VoiceAssistantPersonalitySidebarRightComponent", () => {
    let component: VoiceAssistantPersonalitySidebarRightComponent;
    let fixture: ComponentFixture<VoiceAssistantPersonalitySidebarRightComponent>;
    let voiceAssistantService: jasmine.SpyObj<VoiceAssistantService>;
    let paramsSubject: Subject<{chatUuid: string}>;
    const models = [
        new AssistantModel(1, "gemini-3.8-flash", "Gemini 3.8 Flash", false),
        new AssistantModel(2, "gpt-6", "GPT-6", true),
    ];

    beforeEach(async () => {
        paramsSubject = new BehaviorSubject<{chatUuid: string}>({chatUuid: ""});
        const voiceAssistantServiceSpy: jasmine.SpyObj<VoiceAssistantService> =
            jasmine.createSpyObj(ChatService, [
                "updatePersonality",
                "addPersonality",
                "deletePersonalityById",
                "getAllPersonalities",
                "updatePersonalityById",
                "getAllAssistantModels",
                "getPersonality",
            ]);

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                FormsModule,
                ReactiveFormsModule,
                VoiceAssistantPersonalitySidebarRightComponent,
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
                    provide: VoiceAssistantService,
                    useValue: voiceAssistantServiceSpy,
                },
                {
                    provide: TokenService,
                    useValue: {
                        tokenStatus$: new BehaviorSubject({
                            tokenExists: true,
                            tokenActive: true,
                        }),
                    },
                },
            ],
        }).compileComponents();

        voiceAssistantServiceSpy.getAllAssistantModels.and.callFake(() => {});

        voiceAssistantService = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;

        fixture = TestBed.createComponent(
            VoiceAssistantPersonalitySidebarRightComponent,
        );
        component = fixture.componentInstance;
        component.personalityClone = new VoiceAssistant(
            "id-1",
            "unit-test",
            "male",
            0.8,
            "You are a test roboter",
            1,
        );
        component.personalityFormSidebar = new FormGroup({
            "persona-name": new FormControl(component.personalityClone.name, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(255),
                ],
            }),
            gender: new FormControl(component.personalityClone.gender, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(
                component.personalityClone.pauseThreshold,
                {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.min(0.1),
                        Validators.max(3.0),
                    ],
                },
            ),
            assistantModel: new FormControl(1, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
        voiceAssistantService.personalities = [component.personalityClone];
        voiceAssistantService.assistantModelsSubject = new BehaviorSubject<
            AssistantModel[]
        >(models);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should test if adjustThreshold sets the pausethreshold correctly", () => {
        component.thresholdString = "0.7";
        component.adjustThreshold();
        expect(component.personalityClone.pauseThreshold).toBe(0.7);
    });

    it("should delete personality", () => {
        component.deletePersonality();
        expect(voiceAssistantService.deletePersonalityById).toHaveBeenCalled();
    });

    it("should update personality", () => {
        component.updatePersonality();
        expect(voiceAssistantService.updatePersonalityById).toHaveBeenCalled();
    });

    it("keeps the identity text when the channel switches to Direct", () => {
        component.personalityClone.description = "Du bist pib.";
        component.personalityFormSidebar.controls["channel"].setValue(
            DIRECT_CHANNEL,
        );
        component.updatePersonality();
        const updated =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(updated.channel).toBe(DIRECT_CHANNEL);
        expect(updated.description).toBe("Du bist pib.");
    });

    it("shows no Smart control when Hermes is disabled", () => {
        const capability = TestBed.inject(ChannelCapabilityService);
        capability.applyInstallerFlag(false);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector(
                "[data-test=RBN_Channel_Smart]",
            ),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                "[data-test=LBL_Channel_Direct]",
            ),
        ).not.toBeNull();
        const description = component.personalityClone.description;
        component.updatePersonality();
        const updated =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(updated.channel).toBe(component.personalityClone.channel);
        expect(updated.description).toBe(description);
    });

    it("names a retired model and clears the prompt when a new one is chosen", () => {
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        const retired = new AssistantModel(
            1,
            "retired-entry",
            "Retired entry",
            true,
            null,
            flags,
            "provider-1",
            false,
            true,
        );
        const replacement = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            null,
            flags,
            "provider-4",
            false,
        );
        voiceAssistantService.getPersonality.and.returnValue(
            component.personalityClone,
        );
        voiceAssistantService.assistantModelsSubject.next([
            retired,
            replacement,
        ]);
        fixture.detectChanges();
        const notice = fixture.nativeElement.querySelector(
            "[data-test=LBL_Retired_Model]",
        );
        expect(notice?.textContent?.trim()).toBe(retiredModelNotice(retired));
        const retiredOption = fixture.nativeElement.querySelector(
            "#voice-assistant-model-select-right-sidebar option[value='1']",
        ) as HTMLOptionElement;
        expect(retiredOption.disabled).toBeTrue();
        component.personalityFormSidebar.controls["assistantModel"].setValue(
            "4",
        );
        component.updatePersonality();
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector(
                "[data-test=LBL_Retired_Model]",
            ),
        ).toBeNull();
        expect(component.personalityClone.providerRef).toBe("4");
    });

    it("keeps a gone model selected and does not save a sibling in its place", () => {
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        const flash = new AssistantModel(
            7,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags,
            "provider-1",
            false,
        );
        const live = new AssistantModel(
            11,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            false,
            null,
            {...flags, images: false, live: true},
            "provider-1",
            false,
        );
        const gone = new VoiceAssistant(
            "id-gone",
            "Ada",
            "Female",
            0.8,
            "",
            null,
            10,
            "12",
        );
        gone.needsNewModel = true;
        component.personalityClone = gone;
        voiceAssistantService.getPersonality.and.returnValue(gone);
        voiceAssistantService.assistantModelsSubject.next([flash, live]);
        component.updateForm();
        fixture.detectChanges();

        const notice = fixture.nativeElement.querySelector(
            "[data-test=LBL_Retired_Model]",
        );
        expect(notice?.textContent?.trim()).toBe(
            "This model is gone. Choose a new one.",
        );
        const goneOption = fixture.nativeElement.querySelector(
            "#voice-assistant-model-select-right-sidebar option[value='12']",
        ) as HTMLOptionElement;
        expect(goneOption.disabled).toBeTrue();
        expect(
            component.personalityFormSidebar.controls["assistantModel"].value,
        ).toBe("12");
        component.updatePersonality();
        const kept =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(kept.providerRef).toBe("12");
        expect(kept.assistantModelId).toBe(12);

        component.personalityFormSidebar.controls["assistantModel"].setValue(
            "7",
        );
        component.updatePersonality();
        expect(component.personalityClone.providerRef).toBe("7");
        expect(component.personalityClone.assistantModelId).toBe(7);
    });
});
