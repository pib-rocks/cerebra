import {
    ChangeDetectorRef,
    Component,
    OnInit,
    TemplateRef,
    ViewChild,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {SidebarElement} from "../shared/interfaces/sidebar-element.interface";
import {Observable} from "rxjs";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {
    AbstractControl,
    FormControl,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistant} from "../shared/types/voice-assistant";
import {AssistantModel} from "../shared/types/assistantModel";
import {
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    channelFixedByInstallation,
    channelInstallationFixedExplanation,
    installationModeLabel,
} from "../shared/types/channel-router";
import {ChannelCapabilityService} from "../shared/services/channel-capability.service";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
    NEW_PERSONALITY_REASONING_EFFORT,
    PersonalityDialogValues,
    REASONING_EFFORTS,
    REASONING_EFFORT_UNMANAGED,
    REASONING_EFFORT_UNMANAGED_LABEL,
    VoiceBackendOption,
    enforcePersonalityDialog,
    readPersonalityDialog,
    reasoningAvailability,
    reasoningEffortFromStored,
    reasoningEffortLabel,
    toolCallingAvailability,
    voiceInputOptions,
    voiceOutputOptions,
    reconcileVoiceSelection,
} from "../shared/types/personality-dialog";
import {
    DEFAULT_PROVIDER_REF,
    MISSING_KEY_MARK,
    TokenProbeState,
    effectiveCloudTokenStored,
    credentialNotice,
    isProviderConfigured,
    isProviderOptionDisabled,
    personalityAttention,
    providerOptionValue as providerOptionValueFor,
    providerRefFromSelection,
    providersForSelection,
    resolveProvider,
    retainGoneReference,
    startingModelForNewPersonality,
} from "../shared/types/provider-registry";
import {
    TokenService,
    normalizeTokenStatus,
} from "../shared/services/token.service";
import {VoiceAssistantNavComponent} from "./voice-assistant-nav/voice-assistant-nav.component";
import {RouterOutlet} from "@angular/router";
import {NgClass} from "@angular/common";

@Component({
    selector: "app-voice-assistant",
    templateUrl: "./voice-assistant.component.html",
    styleUrls: ["./voice-assistant.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        VoiceAssistantNavComponent,
        RouterOutlet,
        ReactiveFormsModule,
        NgClass,
        FormsModule,
    ],
})
export class VoiceAssistantComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly changeDetector = inject(ChangeDetectorRef);

    personalityForm!: FormGroup;
    uuid: string | undefined;
    thresholdString: string | undefined;
    voiceInputs: VoiceBackendOption[] = [];
    voiceOutputs: VoiceBackendOption[] = [];
    toolCallingReason: string | null = null;
    reasoningReason: string | null = null;
    /**
     * The stored images value. The switch is gone from the dialog, but the
     * field stays in the payload so an unrelated edit does not drop it.
     */
    private storedImages = false;
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    subject!: Observable<SidebarElement[]>;
    models: AssistantModel[] = [];
    selectionModels: AssistantModel[] = [];
    storedProviderRef: string | null = null;
    cloudTokenStored = false;
    tokenProbe: TokenProbeState = "unknown";
    private probeCloudTokenStored = false;
    smartChatsEnabled = true;
    retiredNotice: string | null = null;
    readonly missingKeyMark = MISSING_KEY_MARK;
    readonly reasoningLevels = REASONING_EFFORTS;
    readonly reasoningEffortUnmanaged = REASONING_EFFORT_UNMANAGED;
    readonly reasoningEffortUnmanagedLabel = REASONING_EFFORT_UNMANAGED_LABEL;
    readonly reasoningEffortLabel = reasoningEffortLabel;
    readonly isProviderConfigured = isProviderConfigured;
    readonly isProviderOptionDisabled = isProviderOptionDisabled;
    button: {enabled: boolean; func: () => void} = {
        enabled: true,
        func: () => {
            return;
        },
    };

    /**
     * The nav's settings button opens this component's shared add/edit dialog.
     * Enabled only while at least one personality exists.
     */
    get editButton(): {
        enabled: boolean;
        func: (personalityId: string) => void;
    } {
        return {
            enabled: this.voiceAssistantService.personalities.length > 0,
            func: (personalityId: string) => this.openEditModal(personalityId),
        };
    }

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private modalService: NgbModal,
        private tokenService: TokenService,
        private channelCapability: ChannelCapabilityService,
    ) {}

    voiceAssistantActivationToggle = new FormControl(false);
    voiceAssistantActiveStatus = false;

    ngOnInit() {
        this.voiceAssistantService.assistantModelsSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((models) => {
                this.models = models;
                this.rebuildSelection();
                this.changeDetector.markForCheck();
            });
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                const resolved = normalizeTokenStatus(status);
                this.probeCloudTokenStored = resolved.tokenExists === true;
                this.tokenProbe = resolved.service;
                this.rebuildSelection();
                this.changeDetector.markForCheck();
            });
        this.channelCapability.smartChatsEnabled$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((enabled) => {
                this.smartChatsEnabled = enabled;
                this.changeDetector.markForCheck();
            });
        this.button.enabled = true;
        this.button.func = this.openAddModal;
        this.subject = this.voiceAssistantService.getSubject();
        this.personalityForm = new FormGroup({
            "name-input": new FormControl("", {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(255),
                ],
            }),
            gender: new FormControl("Female", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(0.8, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.min(0.1),
                    Validators.max(3),
                ],
            }),
            messageHistory: new FormControl(10, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.min(0),
                    Validators.max(20),
                ],
            }),
            assistantModel: new FormControl(DEFAULT_PROVIDER_REF, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            channel: new FormControl(SMART_CHANNEL, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            voiceInput: new FormControl(LOCAL_VOICE_INPUT, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            voiceOutput: new FormControl(LOCAL_VOICE_OUTPUT, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            toolCalling: new FormControl(true, {nonNullable: true}),
            live: new FormControl(false, {nonNullable: true}),
            idleTimeoutSeconds: new FormControl(DEFAULT_IDLE_TIMEOUT_SECONDS, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1)],
            }),
            reasoningEffort: new FormControl(NEW_PERSONALITY_REASONING_EFFORT, {
                nonNullable: true,
            }),
        });
        this.personalityForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.syncConstraints());
        this.syncConstraints();

        this.voiceAssistantService.uuidSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((uuid: string) => {
                this.openEditModal(uuid);
            });
    }

    showModal = () => {
        // The dialog is left through Save or Cancel only: a click on the
        // backdrop or the Escape key no longer dismisses it, so an in-progress
        // edit cannot be lost (or silently kept) by an outside gesture.
        this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "lg",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
            backdrop: "static",
            keyboard: false,
        });
        return this.ngbModalRef;
    };

    deleteCurrentPersonality = () => {
        if (this.uuid) {
            this.voiceAssistantService.deletePersonalityById(this.uuid);
            this.uuid = undefined;
        }
        this.ngbModalRef?.close("deleted");
    };

    savePersonality = () => {
        if (this.personalityForm.valid) {
            if (this.uuid) {
                this.editPersonality(this.uuid);
            } else {
                this.addPersonality();
            }
        }
        this.ngbModalRef?.close("saved");
    };

    closeModal = () => {
        this.ngbModalRef?.close("cancelled");
    };

    adjustThreshold(step: string) {
        const newValue =
            (Number(this.personalityForm.controls["pausethreshold"].value) *
                10 +
                Number(step) * 10) /
            10;
        this.personalityForm.patchValue({
            pausethreshold: newValue,
        });
        if (this.personalityForm.controls["pausethreshold"].hasError("min")) {
            this.personalityForm.patchValue({
                pausethreshold: 0.1,
            });
        }
        if (this.personalityForm.controls["pausethreshold"].hasError("max")) {
            this.personalityForm.patchValue({
                pausethreshold: 3,
            });
        }
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value.toFixed(1) +
            "s";
    }

    openAddModal = () => {
        this.uuid = undefined;
        this.storedImages = false;
        this.storedProviderRef = null;
        this.rebuildSelection();
        const assistantModel = this.initialAssistantModel();
        // defaultChannel() reads the model control. Point it at the model
        // this dialog will show before reset() replaces the previous one.
        this.personalityForm.controls["assistantModel"].setValue(
            assistantModel,
            {emitEvent: false},
        );
        this.personalityForm.reset({
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            assistantModel,
            channel: this.defaultChannel(),
            voiceInput: this.newPersonalityVoiceInput(),
            voiceOutput: this.newPersonalityVoiceOutput(),
            toolCalling: true,
            live: false,
            idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
            reasoningEffort: NEW_PERSONALITY_REASONING_EFFORT,
        });
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
        this.showModal();
    };

    openEditModal = (uuid: string) => {
        this.uuid = uuid;
        if (this.uuid && this.voiceAssistantService.personalities.length > 0) {
            const updatePersonality = this.voiceAssistantService.getPersonality(
                this.uuid,
            );
            const dialog = readPersonalityDialog(updatePersonality);
            this.storedImages = dialog.images;
            this.storedProviderRef = updatePersonality?.providerRef ?? null;
            this.rebuildSelection();
            this.personalityForm.patchValue({
                "name-input": updatePersonality?.name,
                gender: updatePersonality?.gender,
                pausethreshold: updatePersonality?.pauseThreshold,
                messageHistory: updatePersonality?.messageHistory,
                assistantModel:
                    updatePersonality?.providerRef ?? DEFAULT_PROVIDER_REF,
                channel: updatePersonality?.channel ?? SMART_CHANNEL,
                voiceInput: dialog.voiceInput,
                voiceOutput: dialog.voiceOutput,
                toolCalling: dialog.toolCalling,
                live: dialog.live,
                idleTimeoutSeconds: dialog.idleTimeoutSeconds,
                reasoningEffort:
                    dialog.reasoningEffort ?? REASONING_EFFORT_UNMANAGED,
            });
            this.thresholdString =
                this.personalityForm.controls["pausethreshold"].value + "s";
            this.showModal();
        }
    };

    addPersonality() {
        if (this.personalityForm.valid) {
            const choice = providerRefFromSelection(
                String(this.personalityForm.controls["assistantModel"].value),
            );
            const channel = this.defaultChannel();
            this.voiceAssistantService.createPersonality(
                new VoiceAssistant(
                    "",
                    this.personalityForm.controls["name-input"].value,
                    this.personalityForm.controls["gender"].value,
                    this.personalityForm.controls["pausethreshold"].value,
                    "",
                    choice.assistantModelId,
                    this.personalityForm.controls["messageHistory"].value,
                    choice.providerRef,
                    channel,
                    this.dialogFromForm(),
                ),
            );
        }
    }

    editPersonality = (uuid: string) => {
        const updatePersonality = this.voiceAssistantService
            .getPersonality(uuid)
            ?.clone();
        if (updatePersonality) {
            updatePersonality.name =
                this.personalityForm.controls["name-input"].value;
            updatePersonality.gender =
                this.personalityForm.controls["gender"].value;
            updatePersonality.pauseThreshold =
                this.personalityForm.controls["pausethreshold"].value;
            updatePersonality.messageHistory =
                this.personalityForm.controls["messageHistory"].value;
            const choice = providerRefFromSelection(
                String(this.personalityForm.controls["assistantModel"].value),
            );
            updatePersonality.providerRef = choice.providerRef;
            updatePersonality.assistantModelId = choice.assistantModelId;
            updatePersonality.assignDialog(this.dialogFromForm());
            this.voiceAssistantService.updatePersonalityById(updatePersonality);
        }
        this.uuid = undefined;
    };

    providerOptionValue(model: AssistantModel): string {
        return providerOptionValueFor(model, this.storedProviderRef);
    }

    /** Option text: the model's name, plus its credential notice if it has one. */
    modelOptionLabel(model: AssistantModel): string {
        const notice = credentialNotice(
            model,
            this.cloudTokenStored,
            this.models,
            this.tokenProbe,
        );
        return notice == null
            ? model.visualName
            : `${model.visualName} (${notice})`;
    }

    needsAttention = (personalityId: string): boolean => {
        return this.attentionFor(personalityId) != null;
    };

    attentionLabel = (personalityId: string): string => {
        return this.attentionFor(personalityId)?.notice ?? MISSING_KEY_MARK;
    };

    /**
     * Hermes/Smart when the installer left smart chats on; Direct otherwise.
     * The dialog no longer offers a channel control.
     */
    private defaultChannel() {
        return this.smartChatsEnabled ? SMART_CHANNEL : DIRECT_CHANNEL;
    }

    get installationModeLabel(): string {
        return installationModeLabel(this.smartChatsEnabled);
    }

    get channelFixedByInstallation(): boolean {
        return channelFixedByInstallation(this.smartChatsEnabled);
    }

    readonly channelInstallationFixedExplanation =
        channelInstallationFixedExplanation();

    /**
     * Concrete catalogue row for a new personality. Naming that row as the
     * stored reference makes its option the model id, including when the
     * row is the catalogue default, so the control does not carry the
     * "default" pointer.
     */
    private initialAssistantModel(): string {
        const model = startingModelForNewPersonality(
            this.models,
            this.cloudTokenStored,
            this.tokenProbe,
        );
        if (model == null) {
            return DEFAULT_PROVIDER_REF;
        }
        this.storedProviderRef = String(model.id);
        return providerOptionValueFor(model, this.storedProviderRef);
    }

    get showIdleTimeout(): boolean {
        const live = this.personalityForm?.controls["live"];
        return live != null && live.value === true;
    }

    private rebuildSelection() {
        this.cloudTokenStored = effectiveCloudTokenStored(
            this.probeCloudTokenStored,
            this.models,
        );
        const personality =
            this.uuid == null
                ? undefined
                : this.voiceAssistantService.getPersonality(this.uuid);
        this.selectionModels = chatModelsForPersonalityDialog(
            providersForSelection(
                retainGoneReference(
                    this.models,
                    this.storedProviderRef,
                    personality?.needsNewModel === true,
                ),
                this.storedProviderRef,
                this.cloudTokenStored,
                this.tokenProbe,
            ),
        );
        this.voiceInputs = voiceInputOptions(
            this.models,
            this.cloudTokenStored,
            this.tokenProbe,
        );
        this.voiceOutputs = voiceOutputOptions(
            this.models,
            this.cloudTokenStored,
            this.tokenProbe,
        );
        if (this.personalityForm != null) {
            this.syncConstraints();
        }
    }

    private dialogFromForm(): PersonalityDialogValues {
        this.syncConstraints();
        const raw = this.personalityForm.getRawValue();
        return enforcePersonalityDialog(
            {
                voiceInput: String(raw["voiceInput"]),
                voiceOutput: String(raw["voiceOutput"]),
                toolCalling: raw["toolCalling"] === true,
                images: this.storedImages,
                live: raw["live"] === true,
                idleTimeoutSeconds: Number(raw["idleTimeoutSeconds"]),
                reasoningEffort: reasoningEffortFromStored(
                    raw["reasoningEffort"] == null
                        ? null
                        : String(raw["reasoningEffort"]),
                ),
            },
            this.resolvedModel(),
            this.models.length > 0,
        );
    }

    private resolvedModel() {
        if (this.personalityForm == null || this.models.length === 0) {
            return null;
        }
        const selection = String(
            this.personalityForm.controls["assistantModel"].value,
        );
        return resolveProvider(
            providerRefFromSelection(selection).providerRef,
            this.models,
        );
    }

    private syncConstraints(): void {
        if (this.personalityForm == null) {
            return;
        }
        const loaded = this.models.length > 0;
        const model = this.resolvedModel();
        const tools = toolCallingAvailability(model, loaded);
        this.setBlocked(
            this.personalityForm.controls["toolCalling"],
            tools.disabled,
        );
        const reasoning = reasoningAvailability(model, loaded);
        this.setDisabled(
            this.personalityForm.controls["reasoningEffort"],
            reasoning.disabled,
        );
        this.applyDerivedLive(model, loaded);
        this.keepVoiceSelection(
            "voiceInput",
            this.voiceInputs,
            LOCAL_VOICE_INPUT,
        );
        this.keepVoiceSelection(
            "voiceOutput",
            this.voiceOutputs,
            LOCAL_VOICE_OUTPUT,
        );
        this.toolCallingReason = tools.reason;
        this.reasoningReason = reasoning.reason;
        this.retiredNotice = this.retiredNoticeForSelection();
    }

    /** The Live control is not a switch. It follows the chosen model. */
    private applyDerivedLive(
        model: AssistantModel | null,
        registryLoaded: boolean,
    ): void {
        if (!registryLoaded) {
            return;
        }
        const live = this.personalityForm.controls["live"];
        const derived = model?.capabilities?.live === true;
        if (live.value !== derived) {
            live.setValue(derived, {emitEvent: false});
        }
        if (live.enabled) {
            live.disable({emitEvent: false});
        }
    }

    private attentionFor(personalityId: string) {
        const personality =
            this.voiceAssistantService.getPersonality(personalityId);
        if (personality == null) {
            return null;
        }
        return personalityAttention(
            personality.providerRef,
            this.models,
            this.cloudTokenStored,
            personality.needsNewModel,
            this.tokenProbe,
        );
    }

    private retiredNoticeForSelection(): string | null {
        if (this.personalityForm == null) {
            return null;
        }
        const personality =
            this.uuid == null
                ? undefined
                : this.voiceAssistantService.getPersonality(this.uuid);
        const selection = providerRefFromSelection(
            String(this.personalityForm.controls["assistantModel"].value),
        ).providerRef;
        const attention = personalityAttention(
            selection,
            retainGoneReference(
                this.models,
                this.storedProviderRef,
                personality?.needsNewModel === true,
            ),
            this.cloudTokenStored,
            personality?.needsNewModel === true,
            this.tokenProbe,
        );
        if (attention?.reason !== "retired") {
            return null;
        }
        return attention.notice;
    }

    private keepVoiceSelection(
        controlName: string,
        options: VoiceBackendOption[],
        fallback: string,
    ): void {
        const control = this.personalityForm.controls[controlName];
        const current = String(control.value);
        const next = reconcileVoiceSelection(
            current,
            options,
            fallback,
            this.tokenProbe,
        );
        if (next !== current) {
            control.setValue(next, {emitEvent: false});
        }
    }

    /**
     * A new personality starts on the first offered speech option. The
     * options are ordered pib.Cloud, local, other providers, so this is
     * pib.Cloud while that row is offered and the local engine otherwise.
     */
    private newPersonalityVoiceInput(): string {
        return this.voiceInputs[0]?.id ?? LOCAL_VOICE_INPUT;
    }

    private newPersonalityVoiceOutput(): string {
        return this.voiceOutputs[0]?.id ?? LOCAL_VOICE_OUTPUT;
    }

    private setBlocked(control: AbstractControl, blocked: boolean): void {
        if (blocked) {
            if (control.value !== false) {
                control.setValue(false, {emitEvent: false});
            }
            if (control.enabled) {
                control.disable({emitEvent: false});
            }
            return;
        }
        if (control.disabled) {
            control.enable({emitEvent: false});
        }
    }

    /**
     * Greys a control out without touching its value. Reasoning keeps its
     * stored level while the chosen row cannot be given one.
     */
    private setDisabled(control: AbstractControl, disabled: boolean): void {
        if (disabled) {
            if (control.enabled) {
                control.disable({emitEvent: false});
            }
            return;
        }
        if (control.disabled) {
            control.enable({emitEvent: false});
        }
    }
}

/** Speech-to-speech catalogue rows are not chat models in the personality dialog. */
export function chatModelsForPersonalityDialog(
    models: AssistantModel[],
): AssistantModel[] {
    return models.filter((model) => !model.apiName?.endsWith("-live"));
}
