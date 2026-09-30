import {HttpErrorResponse} from "@angular/common/http";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {BehaviorSubject, of, throwError} from "rxjs";
import {SpeechComponent} from "./speech.component";
import {KeyStoreService} from "./key-store.service";
import {KeyStoreSessionService} from "./key-store-session.service";
import {UNLOCKED_MODE} from "./key-store-session";
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
            "setEncryption",
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
                            model.retired,
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

    function encryptionBox(): HTMLInputElement {
        return fixture.nativeElement.querySelector(
            "#encrypt-key-storage",
        ) as HTMLInputElement;
    }

    function toggleEncryption(checked: boolean): void {
        const box = encryptionBox();
        box.checked = checked;
        box.dispatchEvent(new Event("change"));
        fixture.detectChanges();
    }

    function click(selector: string): void {
        (fixture.nativeElement.querySelector(selector) as HTMLElement).click();
        fixture.detectChanges();
    }

    function setPassword(selector: string, value: string): void {
        const input = fixture.nativeElement.querySelector(
            selector,
        ) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event("input"));
        fixture.detectChanges();
    }

    function loadKeyStore(status: {
        encryptKeyStorage: boolean;
        credentialRefs: string[];
        mode?: string;
    }): void {
        keyStore.status.and.returnValue(of(status));
        fixture = TestBed.createComponent(SpeechComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it("shows the encryption toggle on from the key store", () => {
        const box = encryptionBox();
        expect(box.checked).toBeTrue();
        expect(box.disabled).toBeFalse();
        expect(box.getAttribute("data-test")).toBe("CHK_Encrypt_Key_Storage");
        expect(text("label[for='encrypt-key-storage']")).toBe(
            "Encrypt Key Storage (requires password at robot start)",
        );
        expect(text("[data-test=LBL_Key_Storage]")).toBe(
            "Provider keys are encrypted. The operator password is asked at robot start.",
        );
        expect(
            fixture.nativeElement.querySelector("#speech-operator-password"),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-change-password"),
        ).not.toBeNull();
        expect(text("[data-test=BTN_Change_Operator_Password]")).toBe("Change");
        expect(
            fixture.nativeElement.querySelector("#speech-new-password"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-confirm-password"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).toBeNull();
    });

    it("shows cleartext when the key store has encryption off", () => {
        loadKeyStore({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });

        const box = encryptionBox();
        expect(box.checked).toBeFalse();
        expect(box.disabled).toBeFalse();
        expect(text("[data-test=LBL_Key_Storage]")).toBe(
            "Provider keys are stored in cleartext on the robot. No operator password is asked at robot start.",
        );
        expect(
            fixture.nativeElement.querySelector("#speech-operator-password"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-new-password"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-confirm-password"),
        ).toBeNull();
        expect(text("[data-test=BTN_Turn_Encryption_On]")).toBe(
            "Set a password to turn encryption on",
        );
        expect(TestBed.inject(KeyStoreSessionService).mode).toBe(UNLOCKED_MODE);
        expect(
            fixture.nativeElement.querySelector("#startup-password-input"),
        ).toBeNull();
    });

    it("turns encryption off with the entered operator password", () => {
        keyStore.setEncryption.and.returnValue(
            of({successful: true, mode: "unlocked"}),
        );
        keyStore.status.and.returnValue(
            of({
                encryptKeyStorage: false,
                credentialRefs: [],
                mode: "unlocked",
            }),
        );
        component.password = "operator-secret";
        toggleEncryption(false);

        expect(keyStore.setEncryption).toHaveBeenCalledWith(
            false,
            "operator-secret",
        );
        expect(encryptionBox().checked).toBeFalse();
        expect(text("[data-test=LBL_Key_Storage]")).toContain("cleartext");
        expect(TestBed.inject(KeyStoreSessionService).mode).toBe(UNLOCKED_MODE);
    });

    it("leaves the checkbox on and shows the backend error when the switch is refused", () => {
        keyStore.setEncryption.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 400,
                        error: {
                            error: "Password must be at least 8 characters.",
                        },
                    }),
            ),
        );
        component.password = "short";
        toggleEncryption(false);

        expect(keyStore.setEncryption).toHaveBeenCalledWith(false, "short");
        expect(encryptionBox().checked).toBeTrue();
        expect(encryptionBox().disabled).toBeFalse();
        expect(text("#speech-error")).toBe(
            "Password must be at least 8 characters.",
        );
    });

    it("asks for the operator password only when an encrypted store has keys", () => {
        component.password = "";
        toggleEncryption(false);

        expect(keyStore.setEncryption).not.toHaveBeenCalled();
        expect(encryptionBox().checked).toBeTrue();
        expect(text("#speech-error")).toBe("Enter the operator password.");

        component.credentialRefs = [];
        keyStore.setEncryption.and.returnValue(of({successful: true}));
        keyStore.status.and.returnValue(
            of({
                encryptKeyStorage: false,
                credentialRefs: [],
                mode: "unlocked",
            }),
        );
        toggleEncryption(false);

        expect(keyStore.setEncryption).toHaveBeenCalledWith(false, "");
    });

    it("requires the new password twice before encryption is turned on", () => {
        loadKeyStore({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });
        toggleEncryption(true);
        expect(keyStore.setEncryption).not.toHaveBeenCalled();
        expect(encryptionBox().checked).toBeFalse();
        expect(
            fixture.nativeElement.querySelector("#speech-new-password"),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-confirm-password"),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-current-password"),
        ).toBeNull();

        click("#speech-password-ok");
        expect(keyStore.setEncryption).not.toHaveBeenCalled();
        expect(encryptionBox().checked).toBeFalse();
        expect(text("#speech-password-modal-error")).toBe(
            "Enter the new password twice.",
        );

        component.newPassword = "new-secret";
        component.confirmPassword = "other-secret";
        click("#speech-password-ok");
        expect(keyStore.setEncryption).not.toHaveBeenCalled();
        expect(encryptionBox().checked).toBeFalse();
        expect(text("#speech-password-modal-error")).toBe(
            "Enter the new password twice. The two entries do not match.",
        );

        component.confirmPassword = "new-secret";
        keyStore.setEncryption.and.returnValue(
            of({successful: true, mode: "unlocked"}),
        );
        keyStore.status.and.returnValue(
            of({encryptKeyStorage: true, credentialRefs: [], mode: "unlocked"}),
        );
        click("#speech-password-ok");

        expect(keyStore.setEncryption).toHaveBeenCalledWith(true, "new-secret");
        expect(encryptionBox().checked).toBeTrue();
        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).toBeNull();
    });

    it("changes the operator password in a modal and leaves it alone on cancel", () => {
        component.password = "operator-secret";
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector("#speech-operator-password"),
        ).not.toBeNull();
        expect(text("#speech-change-password")).toBe("Change");
        expect(
            fixture.nativeElement.querySelector("#speech-new-password"),
        ).toBeNull();

        click("#speech-change-password");
        const modal = fixture.nativeElement.querySelector(
            "#speech-password-modal",
        ) as HTMLElement;
        expect(modal.classList.contains("modal")).toBeTrue();
        expect(modal.classList.contains("d-block")).toBeTrue();
        expect(modal.classList.contains("cerebra-modal")).toBeTrue();
        expect(
            modal
                .querySelector(".modal-content")
                ?.classList.contains("cerebra-modal"),
        ).toBeFalse();
        expect(
            fixture.nativeElement.querySelector("#speech-current-password"),
        ).not.toBeNull();
        expect(text("#speech-password-modal-title")).toBe(
            "Change operator password",
        );

        setPassword("#speech-current-password", "operator-secret");
        setPassword("#speech-new-password", "new-secret");
        setPassword("#speech-confirm-password", "new-secret");
        click("#speech-password-cancel");

        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).toBeNull();
        expect(keyStore.changePassword).not.toHaveBeenCalled();
        expect(component.password).toBe("operator-secret");
        expect(
            (
                fixture.nativeElement.querySelector(
                    "#speech-operator-password",
                ) as HTMLInputElement
            ).value,
        ).toBe("operator-secret");

        click("#speech-change-password");
        setPassword("#speech-current-password", "operator-secret");
        setPassword("#speech-confirm-password", "new-secret");
        click("#speech-password-ok");
        expect(keyStore.changePassword).not.toHaveBeenCalled();
        expect(text("#speech-password-modal-error")).toBe(
            "Enter the new password twice.",
        );
        expect(fixture.nativeElement.querySelector("#speech-error")).toBeNull();

        keyStore.changePassword.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 400,
                        error: {
                            error: "Password must be at least 8 characters.",
                        },
                    }),
            ),
        );
        setPassword("#speech-current-password", "operator-secret");
        setPassword("#speech-new-password", "new-secret");
        setPassword("#speech-confirm-password", "new-secret");
        click("#speech-password-ok");

        expect(keyStore.changePassword).toHaveBeenCalledWith(
            "operator-secret",
            "new-secret",
            "new-secret",
        );
        expect(text("#speech-password-modal-error")).toBe(
            "Password must be at least 8 characters.",
        );
        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).not.toBeNull();
        expect(component.password).toBe("operator-secret");
        expect(fixture.nativeElement.querySelector("#speech-error")).toBeNull();

        keyStore.changePassword.and.returnValue(of({successful: true}));
        click("#speech-password-ok");
        expect(component.password).toBe("new-secret");
        expect(text("#speech-notice")).toBe("Operator password changed.");
        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).toBeNull();
        expect(
            (
                fixture.nativeElement.querySelector(
                    "#speech-operator-password",
                ) as HTMLInputElement
            ).value,
        ).toBe("new-secret");
    });

    it("turns encryption on from a modal without a current password", () => {
        loadKeyStore({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });
        expect(
            fixture.nativeElement.querySelector("#speech-operator-password"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelectorAll(
                "[data-test=BTN_Turn_Encryption_On]",
            ).length,
        ).toBe(1);

        click("[data-test=BTN_Turn_Encryption_On]");
        expect(
            fixture.nativeElement.querySelector("#speech-current-password"),
        ).toBeNull();
        expect(text("#speech-password-modal-title")).toBe(
            "Set a password to turn encryption on",
        );
        setPassword("#speech-new-password", "new-secret");
        setPassword("#speech-confirm-password", "new-secret");
        keyStore.setEncryption.and.returnValue(
            of({
                successful: false,
                error: "Password must be at least 8 characters.",
            }),
        );
        click("#speech-password-ok");

        expect(keyStore.setEncryption).toHaveBeenCalledWith(true, "new-secret");
        expect(text("#speech-password-modal-error")).toBe(
            "Password must be at least 8 characters.",
        );
        expect(encryptionBox().checked).toBeFalse();
        expect(
            fixture.nativeElement.querySelector("#speech-password-modal"),
        ).not.toBeNull();
        expect(fixture.nativeElement.querySelector("#speech-error")).toBeNull();
    });

    it("stores a provider key in cleartext without an operator password", () => {
        loadKeyStore({
            encryptKeyStorage: false,
            credentialRefs: [],
            mode: "unlocked",
        });
        keyStore.putSecret.and.returnValue(
            of({successful: true, credentialRef: "provider-4"}),
        );
        component.drafts = {4: "sk-clear"};
        component.saveKey(openai);
        fixture.detectChanges();

        expect(keyStore.putSecret).toHaveBeenCalledWith(4, "", "sk-clear");
        expect(fixture.nativeElement.querySelector("#speech-error")).toBeNull();
        expect(text("#speech-notice")).toBe("Key stored for GPT-4o.");
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

    it("does not list a retired catalogue model as a key to store", () => {
        const retired = new AssistantModel(
            9,
            "gpt-4o",
            "GPT-4o retired",
            true,
            "https://api.openai.example/v1",
            flags,
            "provider-9",
            false,
            true,
        );
        models.next([...models.getValue(), retired]);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector("#speech-provider-9"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#speech-provider-4"),
        ).not.toBeNull();
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
