import {ComponentFixture, TestBed} from "@angular/core/testing";
import {BehaviorSubject, of, throwError} from "rxjs";
import {SpeechComponent} from "./speech.component";
import {KeyStoreService} from "./key-store.service";
import {TokenService} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {
    CLOUD_TOKEN_API_NAME,
    personalityNeedsAttention,
    providersForSelection,
} from "src/app/shared/types/provider-registry";

describe("SpeechComponent", () => {
    let fixture: ComponentFixture<SpeechComponent>;
    let component: SpeechComponent;
    let keyStore: jasmine.SpyObj<KeyStoreService>;
    let voiceAssistant: jasmine.SpyObj<VoiceAssistantService>;
    let ros: jasmine.SpyObj<RosService>;
    let tokenStatus: BehaviorSubject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>;
    let models: BehaviorSubject<AssistantModel[]>;

    const flags = {
        tools: true,
        images: true,
        live: false,
        stt: false,
        tts: false,
    };
    const cloud = new AssistantModel(
        1,
        CLOUD_TOKEN_API_NAME,
        "Hermes Agent",
        true,
        "https://cloud.example/v1",
        flags,
        null,
        true,
    );
    const openai = new AssistantModel(
        4,
        "gpt-4o",
        "GPT-4o",
        true,
        "https://api.openai.example/v1",
        flags,
        "provider-4",
        false,
    );

    beforeEach(async () => {
        tokenStatus = new BehaviorSubject<{
            tokenExists: boolean;
            tokenActive: boolean;
        }>({
            tokenExists: true,
            tokenActive: true,
        });
        models = new BehaviorSubject<AssistantModel[]>([cloud, openai]);
        keyStore = jasmine.createSpyObj("KeyStoreService", [
            "status",
            "putSecret",
            "deleteSecret",
            "changePassword",
        ]);
        keyStore.status.and.returnValue(
            of({encryptKeyStorage: true, credentialRefs: ["provider-4"]}),
        );
        voiceAssistant = jasmine.createSpyObj(
            "VoiceAssistantService",
            ["getAllAssistantModels", "setProviderCredential"],
            {assistantModelsSubject: models},
        );
        voiceAssistant.setProviderCredential.and.callFake(
            (providerId: number, credentialRef: string | null) => {
                models.next(
                    models.getValue().map((model) => {
                        if (model.id !== providerId) {
                            return model;
                        }
                        return new AssistantModel(
                            model.id,
                            model.apiName,
                            model.visualName,
                            model.hasImageSupport,
                            model.endpointBase,
                            model.capabilities,
                            credentialRef,
                            model.isDefault,
                        );
                    }),
                );
            },
        );
        ros = jasmine.createSpyObj("RosService", ["deleteTokenMessage"]);

        await TestBed.configureTestingModule({
            imports: [SpeechComponent],
            providers: [
                {provide: KeyStoreService, useValue: keyStore},
                {provide: VoiceAssistantService, useValue: voiceAssistant},
                {provide: RosService, useValue: ros},
                {
                    provide: TokenService,
                    useValue: {
                        tokenStatus$: tokenStatus.asObservable(),
                        checkTokenExists: () => {
                            tokenStatus.next({
                                tokenExists: false,
                                tokenActive: false,
                            });
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SpeechComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function text(selector: string): string {
        return (
            fixture.nativeElement.querySelector(selector)?.textContent ?? ""
        ).trim();
    }

    it("puts pib.Cloud first and does not offer a second key field", () => {
        const cards = fixture.nativeElement.querySelectorAll(".speech-card");
        expect(cards[0].id).toBe("speech-cloud-entry");
        expect(text("#speech-cloud-entry .speech-card-title")).toBe(
            "pib.Cloud",
        );
        expect(
            fixture.nativeElement.querySelector("#speech-cloud-key"),
        ).toBeNull();
        expect(text("#speech-cloud-status")).toContain("SmartConnect token");
        expect(text("#speech-cloud-endpoint")).toBe("https://cloud.example/v1");
        const titles = Array.from(
            fixture.nativeElement.querySelectorAll(".speech-card-title"),
        ).map((node) => (node as HTMLElement).textContent?.trim());
        expect(titles.indexOf("pib.Cloud")).toBeLessThan(
            titles.indexOf("GPT-4o"),
        );
    });

    it("shows the encryption toggle on from the key store", () => {
        const box = fixture.nativeElement.querySelector(
            "#encrypt-key-storage",
        ) as HTMLInputElement;
        expect(box.checked).toBeTrue();
        expect(box.disabled).toBeTrue();
        expect(text("label[for='encrypt-key-storage']")).toBe(
            "Encrypt Key Storage (requires password at robot start)",
        );
    });

    it("shows each provider endpoint next to its key", () => {
        expect(text("#speech-provider-endpoint-4")).toBe(
            "https://api.openai.example/v1",
        );
        const key = fixture.nativeElement.querySelector(
            "#speech-provider-key-4",
        ) as HTMLInputElement;
        expect(key.type).toBe("password");
        expect(text("#speech-provider-state-4")).toBe("Key stored");
    });

    it("deletes a key and lets it be entered again, marking personalities that used the model", () => {
        keyStore.deleteSecret.and.returnValue(of(""));
        component.password = "operator-secret";
        component.deleteKey(openai);
        fixture.detectChanges();

        expect(keyStore.deleteSecret).toHaveBeenCalledWith(
            4,
            "operator-secret",
        );
        expect(voiceAssistant.setProviderCredential).toHaveBeenCalledWith(
            4,
            null,
        );
        const cleared = models.getValue().find((model) => model.id === 4)!;
        expect(
            personalityNeedsAttention(
                String(cleared.id),
                models.getValue(),
                true,
            ),
        ).toBeTrue();
        expect(
            providersForSelection(models.getValue(), null, true).map(
                (model) => model.id,
            ),
        ).not.toContain(4);
        expect(text("#speech-provider-state-4")).toBe("No key");

        keyStore.putSecret.and.returnValue(
            of({successful: true, credentialRef: "provider-4"}),
        );
        component.drafts = {4: "sk-again"};
        component.saveKey(cleared);
        fixture.detectChanges();

        expect(keyStore.putSecret).toHaveBeenCalledWith(
            4,
            "operator-secret",
            "sk-again",
        );
        const restored = models.getValue().find((model) => model.id === 4)!;
        expect(restored.credentialRef).toBe("provider-4");
        expect(
            personalityNeedsAttention(
                String(restored.id),
                models.getValue(),
                true,
            ),
        ).toBeFalse();
        expect(
            providersForSelection(models.getValue(), null, true).map(
                (model) => model.id,
            ),
        ).toContain(4);
        expect(text("#speech-provider-state-4")).toBe("Key stored");
    });

    it("deletes the SmartConnect token without asking for a cloud key", () => {
        const token = TestBed.inject(TokenService) as unknown as {
            checkTokenExists: () => void;
        };
        component.deleteCloudToken();
        fixture.detectChanges();
        expect(ros.deleteTokenMessage).toHaveBeenCalled();
        expect(text("#speech-cloud-status")).toContain("not stored");
        expect(token).toBeTruthy();
    });

    it("shows a key-store error and does not clear the credential", () => {
        keyStore.deleteSecret.and.returnValue(
            throwError(
                () => new Error("Wrong password. No keys are available."),
            ),
        );
        component.password = "nope";
        component.deleteKey(openai);
        fixture.detectChanges();
        expect(text("#speech-error")).toBe(
            "Wrong password. No keys are available.",
        );
        expect(models.getValue()[1].credentialRef).toBe("provider-4");
    });
});
