import {ApplicationRef} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";

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
import {TokenService} from "../shared/services/token.service";
import {AssistantModel} from "../shared/types/assistantModel";
import {
    DEFAULT_PROVIDER_REF,
    ProviderCapabilities,
    retiredModelNotice,
} from "../shared/types/provider-registry";
import {ChannelCapabilityService} from "../shared/services/channel-capability.service";
import {DIRECT_CHANNEL, SMART_CHANNEL} from "../shared/types/channel-router";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    IMAGES_NEED_MCP,
    IMAGES_NEED_TOOL_CALLING,
    LIVE_NO_CAPABILITY,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
} from "../shared/types/personality-dialog";
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
    let _router: Router;
    const models = [
        new AssistantModel(1, "gemini-3.8-flash", "Gemini 3.8 Flash", false),
        new AssistantModel(2, "gpt-6", "GPT-6", true),
    ];

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
                "getAllAssistantModels",
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
                        events: new Subject(),
                        navigate: jasmine.createSpy("navigate"),
                        get url() {
                            return "/test-url";
                        },
                    },
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
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule,
                VoiceAssistantComponent,
                VoiceAssistantNavComponent,
                BoolToOnOffPipe,
            ],
        }).compileComponents();
        voiceAssistantService = TestBed.inject(
            VoiceAssistantService,
        ) as jasmine.SpyObj<VoiceAssistantService>;
        modalService = TestBed.inject(NgbModal);
        _router = TestBed.inject(Router);
        fixture = TestBed.createComponent(VoiceAssistantComponent);
        component = fixture.componentInstance;
        voiceAssistantService.assistantModelsSubject = new BehaviorSubject<
            AssistantModel[]
        >(models);
        component.ngOnInit();
    });

    afterEach(() => {
        if (typeof component.ngbModalRef?.close === "function") {
            component.ngbModalRef.close();
        }
        fixture.destroy();
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

    it("stores the default provider pointer on a new personality", () => {
        component.personalityForm.patchValue({
            "name-input": "Ada",
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            assistantModel: DEFAULT_PROVIDER_REF,
        });
        component.addPersonality();
        const created =
            voiceAssistantService.createPersonality.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(created.providerRef).toBe(DEFAULT_PROVIDER_REF);
        expect(created.assistantModelId).toBeNull();
        expect(created.channel).toBe(SMART_CHANNEL);
    });

    it("stores an explicit provider id when that row is selected", () => {
        component.personalityForm.patchValue({
            "name-input": "Ada",
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            assistantModel: "9",
        });
        component.addPersonality();
        const created =
            voiceAssistantService.createPersonality.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(created.providerRef).toBe("9");
        expect(created.assistantModelId).toBe(9);
    });

    it("offers only rows with the images capability and disables the rest by that flag", () => {
        const flags = (images: boolean): ProviderCapabilities => ({
            tools: true,
            images,
            live: false,
            stt: false,
            tts: false,
        });
        const text = new AssistantModel(
            8,
            "shared-api",
            "Text row",
            false,
            null,
            flags(false),
            null,
            false,
        );
        const vision = new AssistantModel(
            9,
            "shared-api",
            "Vision row",
            true,
            "https://example.test/v1",
            flags(true),
            "provider-key",
            true,
        );
        voiceAssistantService.assistantModelsSubject.next([text, vision]);
        expect(component.selectionModels.map((model) => model.id)).toEqual([
            vision.id,
        ]);
        expect(component.providerOptionValue(vision)).toBe(
            DEFAULT_PROVIDER_REF,
        );
        expect(
            component.isProviderOptionDisabled(
                text,
                component.cloudTokenStored,
            ),
        ).toBeTrue();
        expect(
            component.isProviderOptionDisabled(
                vision,
                component.cloudTokenStored,
            ),
        ).toBeFalse();
        expect(text.apiName).toBe(vision.apiName);
    });

    it("drops a provider from the list as soon as its key is removed", () => {
        const flags = (images: boolean): ProviderCapabilities => ({
            tools: true,
            images,
            live: false,
            stt: false,
            tts: false,
        });
        const keyed = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            "https://api.openai.example/v1",
            flags(true),
            "provider-4",
            false,
        );
        voiceAssistantService.assistantModelsSubject.next([keyed]);
        expect(component.selectionModels.map((model) => model.id)).toEqual([4]);
        const cleared = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            "https://api.openai.example/v1",
            flags(true),
            null,
            false,
        );
        voiceAssistantService.assistantModelsSubject.next([cleared]);
        expect(component.selectionModels).toEqual([]);
        const personality = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "",
            4,
        );
        voiceAssistantService.getPersonality.and.returnValue(personality);
        component.models = [cleared];
        expect(component.needsAttention("persona-1")).toBeTrue();
    });

    it("keeps the identity text when the channel switches to Direct", () => {
        const existing = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
        );
        voiceAssistantService.getPersonality.and.returnValue(existing);
        component.personalityForm.patchValue({
            "name-input": "Ada",
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            channel: DIRECT_CHANNEL,
        });
        component.editPersonality("persona-1");
        const updated =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(updated.channel).toBe(DIRECT_CHANNEL);
        expect(updated.description).toBe("Du bist pib.");
    });

    it("stores Direct and shows no Smart control when Hermes is disabled", () => {
        const capability = TestBed.inject(ChannelCapabilityService);
        capability.applyInstallerFlag(false);
        fixture.detectChanges();
        expect(component.showSmartChannelControl).toBeFalse();
        component.openAddModal();
        component.advancedOpen = true;
        fixture.detectChanges();
        expect(
            document.body.querySelector("[data-test=RBN_Channel_Smart]"),
        ).toBeNull();
        expect(
            document.body.querySelector("[data-test=LBL_Channel_Direct]"),
        ).not.toBeNull();
        component.personalityForm.patchValue({
            "name-input": "Ada",
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            channel: SMART_CHANNEL,
        });
        component.addPersonality();
        const created =
            voiceAssistantService.createPersonality.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(created.channel).toBe(DIRECT_CHANNEL);
        const stored = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            null,
            10,
            DEFAULT_PROVIDER_REF,
            SMART_CHANNEL,
        );
        voiceAssistantService.getPersonality.and.returnValue(stored);
        component.editPersonality("persona-1");
        const updated =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(updated.channel).toBe(SMART_CHANNEL);
        expect(updated.description).toBe("Du bist pib.");
        component.ngbModalRef?.close();
    });

    it("saves Smart and pib.Cloud from the name alone", () => {
        fixture.detectChanges();
        component.openAddModal();
        fixture.detectChanges();
        expect(document.body.querySelector("#name-input")).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=SEC_Advanced]"),
        ).toBeNull();
        expect(
            document.body.querySelector("#voice-assistant-model-select"),
        ).toBeNull();
        const save = document.body.querySelector(
            "#modal-save-button",
        ) as HTMLButtonElement;
        expect(save.disabled).toBeTrue();
        component.personalityForm.patchValue({"name-input": "Ada"});
        fixture.detectChanges();
        expect(
            (
                document.body.querySelector(
                    "#modal-save-button",
                ) as HTMLButtonElement
            ).disabled,
        ).toBeFalse();
        component.addPersonality();
        const created =
            voiceAssistantService.createPersonality.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(created.channel).toBe(SMART_CHANNEL);
        expect(created.providerRef).toBe(DEFAULT_PROVIDER_REF);
        expect(created.assistantModelId).toBeNull();
        expect(created.voiceInput).toBe(LOCAL_VOICE_INPUT);
        expect(created.voiceOutput).toBe(LOCAL_VOICE_OUTPUT);
        expect(created.toolCalling).toBeTrue();
        expect(created.images).toBeFalse();
        expect(created.live).toBeFalse();
        expect(created.mcp).toBeTrue();
        expect(created.idleTimeoutSeconds).toBe(DEFAULT_IDLE_TIMEOUT_SECONDS);
    });

    it("keeps channel, model, voice, and switches inside Advanced", () => {
        const speech = new AssistantModel(
            6,
            "openai",
            "OpenAI",
            true,
            "https://api.openai.example/v1",
            {
                tools: true,
                images: true,
                live: true,
                stt: true,
                tts: true,
            },
            "provider-6",
            true,
        );
        voiceAssistantService.assistantModelsSubject.next([speech]);
        fixture.detectChanges();
        component.openAddModal();
        component.advancedOpen = true;
        fixture.detectChanges();
        expect(
            document.body.querySelector("[data-test=RBN_Channel_Smart]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector(
                "[data-test=DDN_Voice_Assistant_Model]",
            ),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=DDN_Voice_Input]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=DDN_Voice_Output]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=TXT_Threshold]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=CHK_Tool_Calling]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=CHK_Images]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=CHK_Live]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=CHK_Mcp]"),
        ).not.toBeNull();
        expect(
            document.body.querySelector("[data-test=TXT_Idle_Timeout]"),
        ).toBeNull();
        const voiceInput = document.body.querySelector(
            "#voice-input-select",
        ) as HTMLSelectElement;
        const labels = Array.from(voiceInput.options).map(
            (option) => option.value,
        );
        expect(labels).toContain(LOCAL_VOICE_INPUT);
        expect(labels).toContain("6");
        const live = document.body.querySelector(
            "#live-input",
        ) as HTMLInputElement;
        expect(live.disabled).toBeFalse();
        live.click();
        TestBed.inject(ApplicationRef).tick();
        expect(
            document.body.querySelector("[data-test=TXT_Idle_Timeout]"),
        ).not.toBeNull();
        live.click();
        TestBed.inject(ApplicationRef).tick();
        expect(
            document.body.querySelector("[data-test=TXT_Idle_Timeout]"),
        ).toBeNull();
    });

    it("greys out images when tool calling or the MCP server is off", () => {
        const capable = new AssistantModel(
            7,
            "openai",
            "OpenAI",
            true,
            "https://api.openai.example/v1",
            {
                tools: true,
                images: true,
                live: true,
                stt: false,
                tts: false,
            },
            "provider-7",
            true,
        );
        voiceAssistantService.assistantModelsSubject.next([capable]);
        fixture.detectChanges();
        component.openAddModal();
        component.advancedOpen = true;
        fixture.detectChanges();
        const images = () =>
            document.body.querySelector("#images-input") as HTMLInputElement;
        const reason = () =>
            document.body.querySelector("[data-test=LBL_Images_Reason]")
                ?.textContent ?? "";
        expect(images().disabled).toBeFalse();
        expect(
            document.body.querySelector("[data-test=LBL_Images_Reason]"),
        ).toBeNull();
        (
            document.body.querySelector(
                "#tool-calling-input",
            ) as HTMLInputElement
        ).click();
        TestBed.inject(ApplicationRef).tick();
        expect(images().disabled).toBeTrue();
        expect(reason()).toContain(IMAGES_NEED_TOOL_CALLING);
        (
            document.body.querySelector(
                "#tool-calling-input",
            ) as HTMLInputElement
        ).click();
        TestBed.inject(ApplicationRef).tick();
        expect(images().disabled).toBeFalse();
        (document.body.querySelector("#mcp-input") as HTMLInputElement).click();
        TestBed.inject(ApplicationRef).tick();
        expect(images().disabled).toBeTrue();
        expect(reason()).toContain(IMAGES_NEED_MCP);
    });

    it("greys out live when the provider has no live capability and hides the idle timeout", () => {
        const text = new AssistantModel(
            8,
            "anthropic",
            "Claude",
            true,
            "https://api.anthropic.example/v1",
            {
                tools: true,
                images: true,
                live: false,
                stt: false,
                tts: false,
            },
            "provider-8",
            true,
        );
        voiceAssistantService.assistantModelsSubject.next([text]);
        fixture.detectChanges();
        component.openAddModal();
        component.advancedOpen = true;
        fixture.detectChanges();
        const live = document.body.querySelector(
            "#live-input",
        ) as HTMLInputElement;
        expect(live.disabled).toBeTrue();
        expect(
            document.body.querySelector("[data-test=LBL_Live_Reason]")
                ?.textContent,
        ).toContain(LIVE_NO_CAPABILITY);
        expect(
            document.body.querySelector("[data-test=TXT_Idle_Timeout]"),
        ).toBeNull();
        const offered = Array.from(
            (
                document.body.querySelector(
                    "#voice-assistant-model-select",
                ) as HTMLSelectElement
            ).options,
        ).filter((option) => !option.disabled);
        expect(offered.map((option) => option.textContent?.trim())).toEqual([
            "Claude",
        ]);
    });

    it("shows the catalogue, keeps a retired model out of a new personality, and clears the prompt when a new model is chosen", () => {
        const flags = (live: boolean): ProviderCapabilities => ({
            tools: true,
            images: true,
            live,
            stt: false,
            tts: false,
        });
        const gemini = new AssistantModel(
            3,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags(true),
            "provider-3",
            false,
        );
        const gpt = new AssistantModel(
            4,
            "gpt-6",
            "GPT-6",
            true,
            null,
            flags(false),
            "provider-4",
            false,
        );
        const claude = new AssistantModel(
            5,
            "claude-sonnet-5-5",
            "Claude Sonnet 5.5",
            true,
            null,
            flags(false),
            "provider-5",
            false,
        );
        const cloud = new AssistantModel(
            6,
            "pib-cloud",
            "pib.Cloud",
            true,
            null,
            flags(false),
            "provider-6",
            true,
        );
        const retired = new AssistantModel(
            1,
            "retired-entry",
            "Retired entry",
            true,
            null,
            flags(false),
            "provider-1",
            false,
            true,
        );
        voiceAssistantService.assistantModelsSubject.next([
            gemini,
            gpt,
            claude,
            cloud,
            retired,
        ]);
        fixture.detectChanges();
        component.openAddModal();
        component.advancedOpen = true;
        fixture.detectChanges();
        TestBed.inject(ApplicationRef).tick();
        const offered = () =>
            Array.from(
                (
                    document.body.querySelector(
                        "#voice-assistant-model-select",
                    ) as HTMLSelectElement
                ).options,
            );
        const selectable = offered()
            .filter((option) => !option.disabled)
            .map((option) => option.textContent?.trim());
        expect(selectable).toEqual([
            "Gemini 3.8 Flash",
            "GPT-6",
            "Claude Sonnet 5.5",
            "pib.Cloud",
        ]);
        expect(selectable).not.toContain(retired.visualName);
        expect(
            document.body.querySelector("[data-test=LBL_Retired_Model]"),
        ).toBeNull();
        component.ngbModalRef?.close();

        const persona = new VoiceAssistant(
            "persona-retired",
            "Eva",
            "Female",
            0.8,
            "",
            retired.id,
            10,
            String(retired.id),
        );
        voiceAssistantService.personalities.push(persona);
        voiceAssistantService.getPersonality.and.returnValue(persona);
        expect(component.needsAttention(persona.personalityId)).toBeTrue();
        expect(component.attentionLabel(persona.personalityId)).toBe(
            retiredModelNotice(retired),
        );
        component.openEditModal(persona.personalityId);
        component.advancedOpen = true;
        fixture.detectChanges();
        TestBed.inject(ApplicationRef).tick();
        expect(component.personalityForm.controls["assistantModel"].value).toBe(
            String(retired.id),
        );
        const retiredOption = offered().find(
            (option) => option.value === String(retired.id),
        );
        expect(retiredOption?.disabled).toBeTrue();
        expect(
            document.body.querySelector("[data-test=LBL_Retired_Model]")
                ?.textContent,
        ).toContain(retiredModelNotice(retired));
        component.editPersonality(persona.personalityId);
        const kept =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(kept.providerRef).toBe(String(retired.id));

        component.personalityForm.controls["assistantModel"].setValue(
            String(gemini.id),
        );
        fixture.detectChanges();
        TestBed.inject(ApplicationRef).tick();
        expect(
            document.body.querySelector("[data-test=LBL_Retired_Model]"),
        ).toBeNull();
        component.editPersonality(persona.personalityId);
        const updated =
            voiceAssistantService.updatePersonalityById.calls.mostRecent()
                .args[0] as VoiceAssistant;
        expect(updated.providerRef).toBe(String(gemini.id));
        persona.providerRef = String(gemini.id);
        expect(component.needsAttention(persona.personalityId)).toBeFalse();
        component.ngbModalRef?.close();
    });

    it("loads the example personalities on pib.Cloud with the model enabled", () => {
        const flags = (live: boolean): ProviderCapabilities => ({
            tools: true,
            images: true,
            live,
            stt: false,
            tts: false,
        });
        voiceAssistantService.assistantModelsSubject.next([
            new AssistantModel(
                7,
                "gemini-3.8-flash",
                "Gemini 3.8 Flash",
                true,
                null,
                flags(true),
                null,
                false,
            ),
            new AssistantModel(
                8,
                "gpt-6",
                "GPT-6",
                true,
                null,
                flags(false),
                null,
                false,
            ),
            new AssistantModel(
                9,
                "claude-sonnet-5-5",
                "Claude Sonnet 5.5",
                true,
                null,
                flags(false),
                null,
                false,
            ),
            new AssistantModel(
                6,
                "pib-cloud",
                "pib.Cloud",
                true,
                null,
                flags(false),
                "provider-6",
                true,
            ),
        ]);
        fixture.detectChanges();
        const examples = [
            new VoiceAssistant(
                "66ed525d-42bb-41a2-8a52-f2c1b6e989ad",
                "Eva",
                "Female",
                0.5,
                "You are a helpful assistant.",
                null,
                15,
                DEFAULT_PROVIDER_REF,
                SMART_CHANNEL,
            ),
            new VoiceAssistant(
                "2cb257e4-d173-44a6-869c-6488c98e8edb",
                "Tom",
                "Male",
                0.9,
                "You are a helpful assistant.",
                null,
                5,
                DEFAULT_PROVIDER_REF,
                DIRECT_CHANNEL,
            ),
        ];
        for (const persona of examples) {
            voiceAssistantService.personalities.length = 0;
            voiceAssistantService.personalities.push(persona);
            voiceAssistantService.getPersonality.and.returnValue(persona);
            expect(component.needsAttention(persona.personalityId)).toBeFalse();
            component.openEditModal(persona.personalityId);
            component.advancedOpen = true;
            fixture.detectChanges();
            TestBed.inject(ApplicationRef).tick();
            expect(
                document.body.querySelector("[data-test=LBL_Retired_Model]"),
            ).toBeNull();
            const select = document.body.querySelector(
                "#voice-assistant-model-select",
            ) as HTMLSelectElement;
            const options = Array.from(select.options);
            expect(
                options
                    .filter((option) => !option.disabled)
                    .map((option) => option.textContent?.trim()),
            ).toEqual(["pib.Cloud"]);
            expect(select.value).toBe(DEFAULT_PROVIDER_REF);
            const selected = options.find(
                (option) => option.value === select.value,
            );
            expect(selected?.disabled).toBeFalse();
            expect(component.personalityForm.controls["name-input"].value).toBe(
                persona.name,
            );
            expect(component.personalityForm.controls["channel"].value).toBe(
                persona.channel,
            );
            component.ngbModalRef?.close();
        }
    });
});
