import {NgClass} from "@angular/common";
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ProviderHealthService} from "src/app/shared/services/provider-health.service";
import {
    ProviderHealth,
    healthCssClass,
    healthTooltip,
    reasonLabel,
} from "src/app/shared/types/provider-health";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {
    ProviderKeyAccount,
    TokenProbeState,
    persistedCloudCredentialPresent,
    providerKeyAccounts,
    usesCloudToken,
} from "src/app/shared/types/provider-registry";
import {
    TokenService,
    normalizeTokenStatus,
} from "src/app/shared/services/token.service";
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
    selector: "app-keys",
    templateUrl: "./keys.component.html",
    styleUrls: ["./keys.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass],
})
export class KeysComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly changeDetector = inject(ChangeDetectorRef);

    encryptKeyStorage = true;
    credentialRefs: string[] = [];
    cloudCredentialPresent = false;
    cloudTokenActive = false;
    tokenProbe: TokenProbeState = "unknown";
    private probeCloudTokenStored = false;
    private tokenProbeError: string | null = null;
    providers: AssistantModel[] = [];
    keyProviders: ProviderKeyAccount[] = [];
    password = "";
    newPassword = "";
    confirmPassword = "";
    dialogPassword = "";
    passwordDialog: "change" | "enable" | null = null;
    passwordDialogError: string | null = null;
    private passwordRequest = 0;
    drafts: Record<number, string> = {};
    error: string | null = null;
    notice: string | null = null;
    busy = false;
    providerHealth: Record<number, ProviderHealth> = {};
    providerHealthLoading: Record<number, boolean> = {};
    private readonly probedProviderIds = new Set<number>();

    constructor(
        private readonly keyStore: KeyStoreService,
        private readonly session: KeyStoreSessionService,
        private readonly tokenService: TokenService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly rosService: RosService,
        private readonly providerHealthService: ProviderHealthService,
    ) {}

    ngOnInit(): void {
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                const resolved = normalizeTokenStatus(status);
                this.tokenProbe = resolved.service;
                this.tokenProbeError = resolved.error;
                this.probeCloudTokenStored = resolved.tokenExists === true;
                this.cloudTokenActive = resolved.tokenActive === true;
                this.refreshCloudPresence();
                this.changeDetector.markForCheck();
            });
        this.voiceAssistantService.assistantModelsSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((models) => {
                this.providers = models.filter(
                    (model) => !usesCloudToken(model) && !model.retired,
                );
                this.keyProviders = providerKeyAccounts(this.providers);
                this.probeNewProviders();
                this.refreshCloudPresence();
                this.changeDetector.markForCheck();
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

    cloudStatus(): string {
        if (this.tokenProbe === "unavailable") {
            if (this.cloudCredentialPresent) {
                return this.tokenProbeError
                    ? `SmartConnect credential is stored. ${this.tokenProbeError}`
                    : "SmartConnect credential is stored. Token status is unavailable.";
            }
            return this.tokenProbeError
                ? `SmartConnect status is unavailable. ${this.tokenProbeError}`
                : "SmartConnect status is unavailable.";
        }
        if (this.tokenProbe === "unknown" || this.tokenProbe === "loading") {
            return "SmartConnect status is loading.";
        }
        if (!this.cloudCredentialPresent && !this.probeCloudTokenStored) {
            return "SmartConnect token is not stored.";
        }
        if (
            this.cloudCredentialPresent &&
            this.tokenProbe !== "available" &&
            !this.probeCloudTokenStored
        ) {
            return this.tokenProbeError
                ? `SmartConnect credential is stored. ${this.tokenProbeError}`
                : "SmartConnect credential is stored. Token status is unavailable.";
        }
        if (!this.cloudTokenActive) {
            return "SmartConnect token is stored but not active.";
        }
        return "SmartConnect token is stored and active.";
    }

    cloudDeleteEnabled(): boolean {
        return this.cloudCredentialPresent || this.probeCloudTokenStored;
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

    providerHealthClass(account: ProviderKeyAccount): string {
        return healthCssClass(
            this.providerHealth[account.id]?.state ?? "unknown",
        );
    }

    providerHealthText(account: ProviderKeyAccount): string {
        if (this.providerHealthLoading[account.id]) {
            return "Checking key…";
        }
        const h = this.providerHealth[account.id];
        if (!h) {
            return "Not checked";
        }
        if (h.state === "healthy") {
            return h.latencyMs != null
                ? `Valid (${h.latencyMs} ms)`
                : "Valid (reachable)";
        }
        if (h.state === "unreachable") {
            if (h.reason === "key_rejected" || h.reason === "token_invalid") {
                return h.detail
                    ? `Invalid key (${reasonLabel(h.reason)}): ${h.detail}`
                    : `Invalid key (${reasonLabel(h.reason)})`;
            }
            return h.detail
                ? `Unreachable (${reasonLabel(h.reason)}): ${h.detail}`
                : `Unreachable (${reasonLabel(h.reason)})`;
        }
        return `Not checked (${reasonLabel(h.reason)})`;
    }

    providerHealthTooltip(account: ProviderKeyAccount): string {
        return healthTooltip(this.providerHealth[account.id], account.name);
    }

    probeProviderHealth(account: ProviderKeyAccount): void {
        const modelId = account.modelIds[0] ?? account.id;
        this.providerHealthLoading = {
            ...this.providerHealthLoading,
            [account.id]: true,
        };
        this.changeDetector.markForCheck();
        this.providerHealthService
            .check(modelId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((health) => {
                this.providerHealth = {
                    ...this.providerHealth,
                    [account.id]: health,
                };
                this.providerHealthLoading = {
                    ...this.providerHealthLoading,
                    [account.id]: false,
                };
                this.changeDetector.markForCheck();
            });
    }

    private probeNewProviders(): void {
        for (const account of this.keyProviders) {
            if (this.probedProviderIds.has(account.id)) {
                continue;
            }
            this.probedProviderIds.add(account.id);
            this.probeProviderHealth(account);
        }
    }

    saveKey(account: ProviderKeyAccount): void {
        const secret = (this.drafts[account.id] ?? "").trim();
        if (secret === "" || (this.encryptKeyStorage && this.password === "")) {
            this.error = "Enter the operator password and the provider key.";
            this.notice = null;
            return;
        }
        this.busy = true;
        this.error = null;
        this.keyStore
            .putSecret(account.id, this.password, secret)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.busy = false;
                    this.drafts = {...this.drafts, [account.id]: ""};
                    this.voiceAssistantService.setProviderCredential(
                        account.id,
                        result.credentialRef ?? `provider-${account.id}`,
                    );
                    this.voiceAssistantService.getAllAssistantModels();
                    this.notice = `Key stored for ${account.name}.`;
                    this.loadStatus();
                    this.probeProviderHealth(account);
                },
                error: (err: unknown) => {
                    this.busy = false;
                    this.notice = null;
                    this.error = keyStoreErrorMessage(err);
                },
            });
    }

    deleteKey(account: ProviderKeyAccount): void {
        if (this.encryptKeyStorage && this.password === "") {
            this.error = "Enter the operator password to delete a key.";
            this.notice = null;
            return;
        }
        this.busy = true;
        this.error = null;
        this.keyStore
            .deleteSecret(account.id, this.password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.busy = false;
                    this.drafts = {...this.drafts, [account.id]: ""};
                    this.voiceAssistantService.setProviderCredential(
                        account.id,
                        null,
                    );
                    this.voiceAssistantService.getAllAssistantModels();
                    this.notice = `Key deleted for ${account.name}. Personalities that use it need a key.`;
                    this.loadStatus();
                    this.probeProviderHealth(account);
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
        this.loadStatus();
        this.voiceAssistantService.getAllAssistantModels();
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
            this.openPasswordDialog("enable");
            return;
        }
        this.turnEncryptionOff();
    }

    passwordDialogTitle(): string {
        return this.passwordDialog === "enable"
            ? "Set a password to turn encryption on"
            : "Change operator password";
    }

    openPasswordDialog(variant: "change" | "enable"): void {
        this.passwordDialog = variant;
        this.passwordDialogError = null;
        this.dialogPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
    }

    onDialogPasswordInput(event: Event): void {
        this.dialogPassword = (event.target as HTMLInputElement).value;
    }

    confirmPasswordDialog(): void {
        if (this.passwordDialog == null || this.busy) {
            return;
        }
        const mismatch = this.encryptionPasswordError();
        if (mismatch != null) {
            this.passwordDialogError = mismatch;
            this.notice = null;
            return;
        }
        if (this.passwordDialog === "enable") {
            this.postEncryption(true, this.newPassword);
            return;
        }
        this.changePassword();
    }

    cancelPasswordDialog(): void {
        this.busy = false;
        this.closePasswordDialog();
    }

    changePassword(): void {
        const request = this.passwordRequest;
        const nextPassword = this.newPassword;
        this.busy = true;
        this.error = null;
        this.passwordDialogError = null;
        this.keyStore
            .changePassword(
                this.dialogPassword,
                this.newPassword,
                this.confirmPassword,
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    if (request !== this.passwordRequest) {
                        return;
                    }
                    this.busy = false;
                    this.password = nextPassword;
                    this.notice = "Operator password changed.";
                    this.closePasswordDialog();
                },
                error: (err: unknown) => {
                    if (request !== this.passwordRequest) {
                        return;
                    }
                    this.busy = false;
                    this.notice = null;
                    this.passwordDialogError = keyStoreErrorMessage(err);
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

    private encryptionPasswordError(): string | null {
        if (this.newPassword === "") {
            return "Enter the new password twice.";
        }
        if (this.newPassword !== this.confirmPassword) {
            return "Enter the new password twice. The two entries do not match.";
        }
        return null;
    }

    private postEncryption(enabled: boolean, password: string): void {
        const request = this.passwordRequest;
        const fromDialog = this.passwordDialog != null;
        this.busy = true;
        this.error = null;
        this.notice = null;
        if (fromDialog) {
            this.passwordDialogError = null;
        }
        this.keyStore
            .setEncryption(enabled, password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    if (fromDialog && request !== this.passwordRequest) {
                        return;
                    }
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
                    }
                    if (fromDialog) {
                        this.closePasswordDialog();
                    }
                    this.encryptionApplied(enabled, result);
                },
                error: (err: unknown) => {
                    if (fromDialog && request !== this.passwordRequest) {
                        return;
                    }
                    this.encryptionRefused(err);
                },
            });
    }

    private closePasswordDialog(): void {
        this.passwordRequest++;
        this.passwordDialog = null;
        this.passwordDialogError = null;
        this.dialogPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
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
        const message =
            typeof err === "string" ? err : keyStoreErrorMessage(err);
        if (this.passwordDialog != null) {
            this.passwordDialogError = message;
            return;
        }
        this.error = message;
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
        this.refreshCloudPresence();
        this.changeDetector.markForCheck();
    }

    private refreshCloudPresence(): void {
        const catalogue =
            this.voiceAssistantService.assistantModelsSubject?.getValue() ?? [];
        this.cloudCredentialPresent = persistedCloudCredentialPresent(
            catalogue,
            this.credentialRefs,
        );
    }
}
