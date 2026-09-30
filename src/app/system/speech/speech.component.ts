import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {usesCloudToken} from "src/app/shared/types/provider-registry";
import {TokenService} from "src/app/shared/services/token.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {KeyStoreSessionService} from "./key-store-session.service";
import {
    KeyStoreEncryptionResult,
    KeyStoreService,
    KeyStoreStatus,
    keyStoreErrorMessage,
} from "./key-store.service";

@Component({
    selector: "app-speech",
    templateUrl: "./speech.component.html",
    styleUrls: ["./speech.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SpeechComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    encryptKeyStorage = true;
    credentialRefs: string[] = [];
    cloudTokenStored = false;
    cloudTokenActive = false;
    cloudProvider: AssistantModel | null = null;
    providers: AssistantModel[] = [];
    password = "";
    newPassword = "";
    confirmPassword = "";
    changingPassword = false;
    drafts: Record<number, string> = {};
    error: string | null = null;
    notice: string | null = null;
    busy = false;

    constructor(
        private readonly keyStore: KeyStoreService,
        private readonly session: KeyStoreSessionService,
        private readonly tokenService: TokenService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly rosService: RosService,
    ) {}

    ngOnInit(): void {
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                this.cloudTokenStored = status.tokenExists;
                this.cloudTokenActive = status.tokenActive;
            });
        this.voiceAssistantService.assistantModelsSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((models) => {
                this.cloudProvider =
                    models.find((model) => usesCloudToken(model)) ?? null;
                this.providers = models.filter(
                    (model) => !usesCloudToken(model) && !model.retired,
                );
            });
        this.voiceAssistantService.getAllAssistantModels();
        this.loadStatus();
    }

    keyStorageHint(): string {
        if (this.encryptKeyStorage) {
            return "Provider keys are encrypted. The operator password is asked at robot start.";
        }
        return "Provider keys are stored in cleartext on the robot. No operator password is asked at robot start.";
    }

    endpointText(model: AssistantModel | null): string {
        const endpoint = model?.endpointBase?.trim() ?? "";
        return endpoint === "" ? "—" : endpoint;
    }

    cloudStatus(): string {
        if (!this.cloudTokenStored) {
            return "SmartConnect token is not stored.";
        }
        if (this.cloudTokenActive) {
            return "SmartConnect token is stored and active.";
        }
        return "SmartConnect token is stored.";
    }

    onPasswordInput(event: Event): void {
        this.password = (event.target as HTMLInputElement).value;
    }

    onNewPasswordInput(event: Event): void {
        this.newPassword = (event.target as HTMLInputElement).value;
    }

    onConfirmPasswordInput(event: Event): void {
        this.confirmPassword = (event.target as HTMLInputElement).value;
    }

    onDraft(providerId: number, event: Event): void {
        this.drafts = {
            ...this.drafts,
            [providerId]: (event.target as HTMLInputElement).value,
        };
    }

    saveKey(model: AssistantModel): void {
        const secret = (this.drafts[model.id] ?? "").trim();
        if (this.password === "" || secret === "") {
            this.error = "Enter the operator password and the provider key.";
            this.notice = null;
            return;
        }
        this.busy = true;
        this.error = null;
        this.keyStore
            .putSecret(model.id, this.password, secret)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.busy = false;
                    this.drafts = {...this.drafts, [model.id]: ""};
                    this.voiceAssistantService.setProviderCredential(
                        model.id,
                        result.credentialRef ?? `provider-${model.id}`,
                    );
                    this.voiceAssistantService.getAllAssistantModels();
                    this.notice = `Key stored for ${model.visualName}.`;
                    this.loadStatus();
                },
                error: (err: unknown) => {
                    this.busy = false;
                    this.notice = null;
                    this.error = keyStoreErrorMessage(err);
                },
            });
    }

    deleteKey(model: AssistantModel): void {
        if (this.password === "") {
            this.error = "Enter the operator password to delete a key.";
            this.notice = null;
            return;
        }
        this.busy = true;
        this.error = null;
        this.keyStore
            .deleteSecret(model.id, this.password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.busy = false;
                    this.drafts = {...this.drafts, [model.id]: ""};
                    this.voiceAssistantService.setProviderCredential(
                        model.id,
                        null,
                    );
                    this.voiceAssistantService.getAllAssistantModels();
                    this.notice = `Key deleted for ${model.visualName}. Personalities that use it need a key.`;
                    this.loadStatus();
                },
                error: (err: unknown) => {
                    this.busy = false;
                    this.notice = null;
                    this.error = keyStoreErrorMessage(err);
                },
            });
    }

    deleteCloudToken(): void {
        this.rosService.deleteTokenMessage();
        this.tokenService.checkTokenExists();
        this.notice =
            "SmartConnect token deleted. Re-enter it in SmartConnect.";
        this.error = null;
    }

    onEncryptionToggle(event: Event): void {
        const input = event.target as HTMLInputElement;
        const enabled = input.checked;
        input.checked = this.encryptKeyStorage;
        if (enabled === this.encryptKeyStorage || this.busy) {
            return;
        }
        if (enabled) {
            this.turnEncryptionOn();
            return;
        }
        this.turnEncryptionOff();
    }

    togglePasswordChange(): void {
        this.changingPassword = !this.changingPassword;
        this.newPassword = "";
        this.confirmPassword = "";
    }

    changePassword(): void {
        this.busy = true;
        this.error = null;
        this.keyStore
            .changePassword(
                this.password,
                this.newPassword,
                this.confirmPassword,
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.busy = false;
                    this.password = this.newPassword;
                    this.newPassword = "";
                    this.confirmPassword = "";
                    this.changingPassword = false;
                    this.notice = "Operator password changed.";
                },
                error: (err: unknown) => {
                    this.busy = false;
                    this.notice = null;
                    this.error = keyStoreErrorMessage(err);
                },
            });
    }

    private turnEncryptionOff(): void {
        if (this.credentialRefs.length > 0 && this.password === "") {
            this.error = "Enter the operator password.";
            this.notice = null;
            return;
        }
        this.postEncryption(false, this.password);
    }

    private turnEncryptionOn(): void {
        const mismatch = this.encryptionPasswordError();
        if (mismatch != null) {
            this.changingPassword = true;
            this.error = mismatch;
            this.notice = null;
            return;
        }
        this.postEncryption(true, this.newPassword);
    }

    private encryptionPasswordError(): string | null {
        if (this.newPassword === "" && this.confirmPassword === "") {
            return "Enter the new password twice.";
        }
        if (this.newPassword !== this.confirmPassword) {
            return "Enter the new password twice. The two entries do not match.";
        }
        return null;
    }

    private postEncryption(enabled: boolean, password: string): void {
        this.busy = true;
        this.error = null;
        this.notice = null;
        this.keyStore
            .setEncryption(enabled, password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    if (result?.successful === false) {
                        this.encryptionRefused(
                            result.error != null && result.error !== ""
                                ? result.error
                                : "Key store request failed.",
                        );
                        return;
                    }
                    if (enabled) {
                        this.password = this.newPassword;
                        this.newPassword = "";
                        this.confirmPassword = "";
                        this.changingPassword = false;
                    }
                    this.encryptionApplied(enabled, result);
                },
                error: (err: unknown) => this.encryptionRefused(err),
            });
    }

    private encryptionApplied(
        enabled: boolean,
        result: KeyStoreEncryptionResult,
    ): void {
        this.busy = false;
        this.encryptKeyStorage = enabled;
        this.error = null;
        this.notice = enabled
            ? "Key storage is encrypted."
            : "Provider keys are stored in cleartext on the robot.";
        this.session.noteStatus({
            encryptKeyStorage: enabled,
            mode: result?.mode,
        });
        this.loadStatus();
    }

    private encryptionRefused(err: unknown): void {
        this.busy = false;
        this.notice = null;
        this.error = typeof err === "string" ? err : keyStoreErrorMessage(err);
    }

    private loadStatus(): void {
        this.keyStore
            .status()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (status) => this.applyStatus(status),
                error: () => {
                    this.encryptKeyStorage = true;
                    this.error = "Key store status could not be loaded.";
                },
            });
    }

    private applyStatus(status: KeyStoreStatus): void {
        this.encryptKeyStorage = status.encryptKeyStorage;
        this.credentialRefs = status.credentialRefs ?? [];
        this.session.noteStatus(status);
    }
}
