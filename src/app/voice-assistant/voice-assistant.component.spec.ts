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
import {BehaviorSubject} from "rxjs";
import {TokenService} from "../shared/services/token.service";
import {AssistantModel} from "../shared/types/assistantModel";
import {
    DEFAULT_PROVIDER_REF,
    ProviderCapabilities,
} from "../shared/types/provider-registry";
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
        new AssistantModel(1, "gpt-3", "GPT-3", false),
        new AssistantModel(2, "gpt-4", "GPT-4", true),
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
            "gpt-4o",
            "GPT-4o",
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
            "gpt-4o",
            "GPT-4o",
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
});
