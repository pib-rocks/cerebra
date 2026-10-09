import {
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
    parseChatChannel,
    showSmartChannelControl,
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
    imageSwitchAvailability,
    readPersonalityDialog,
    reasoningEffortFromStored,
    reasoningEffortLabel,
    toolCallingAvailability,
    voiceInputOptions,
    voiceOutputOptions,
} from "../shared/types/personality-dialog";
import {
    DEFAULT_PROVIDER_REF,
    MISSING_KEY_MARK,
    isOfflineModel,
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
import {TokenService} from "../shared/services/token.service";
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

    personalityForm!: FormGroup;
    uuid: string | undefined;
    thresholdString: string | undefined;
    advancedOpen = false;
    voiceInputs: VoiceBackendOption[] = [];
    voiceOutputs: VoiceBackendOption[] = [];
    toolCallingReason: string | null = null;
    imageReason: string | null = null;
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    imgSrc: string = "../../assets/toggle-switch-left.png";
    subject!: Observable<SidebarElement[]>;
    models: AssistantModel[] = [];
    selectionModels: AssistantModel[] = [];
    storedProviderRef: string | null = null;
    cloudTokenStored = false;
    smartChatsEnabled = true;
    /**
     * True while a stored personality is copied into the form. That copy
     * is not the user selecting the on-device model, so the channel it
     * already carries is left alone.
     */
    private retainStoredChannel = false;
    /** Last model-control value seen by syncConstraints. */
    private seenAssistantModel: string | null = null;
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
            });
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                this.cloudTokenStored = status.tokenExists;
                this.rebuildSelection();
            });
        this.channelCapability.smartChatsEnabled$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((enabled) => {
                this.smartChatsEnabled = enabled;
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
            images: new FormControl(false, {nonNullable: true}),
            live: new FormControl(false, {nonNullable: true}),
            idleTimeoutSeconds: new FormControl(DEFAULT_IDLE_TIMEOUT_SECONDS, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1)],
            }),
            mcp: new FormControl(true, {nonNullable: true}),
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

    toggleAdvanced = () => {
        this.advancedOpen = !this.advancedOpen;
    };

    openAddModal = () => {
        this.uuid = undefined;
        this.advancedOpen = false;
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
            voiceInput: LOCAL_VOICE_INPUT,
            voiceOutput: LOCAL_VOICE_OUTPUT,
            toolCalling: true,
            images: false,
            live: false,
            idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
            mcp: true,
            reasoningEffort: NEW_PERSONALITY_REASONING_EFFORT,
        });
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
        this.showModal();
    };

    openEditModal = (uuid: string) => {
        this.uuid = uuid;
        this.advancedOpen = false;
        if (this.uuid && this.voiceAssistantService.personalities.length > 0) {
            const updatePersonality = this.voiceAssistantService.getPersonality(
                this.uuid,
            );
            const dialog = readPersonalityDialog(updatePersonality);
            this.storedProviderRef = updatePersonality?.providerRef ?? null;
            this.rebuildSelection();
            this.retainStoredChannel = true;
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
                images: dialog.images,
                live: dialog.live,
                idleTimeoutSeconds: dialog.idleTimeoutSeconds,
                mcp: dialog.mcp,
                reasoningEffort:
                    dialog.reasoningEffort ?? REASONING_EFFORT_UNMANAGED,
            });
            this.retainStoredChannel = false;
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
            // The Smart control is hidden for the installer flag and for the
            // on-device model. A new personality is then stored as Direct,
            // so the on-device model can never be sent with channel smart.
            const channel = this.showSmartChannelControl
                ? parseChatChannel(
                      String(this.personalityForm.controls["channel"].value),
                  )
                : DIRECT_CHANNEL;
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
            if (this.offlineModelSelected) {
                // Smart runs through Hermes, which needs a 64,000 token
                // context window. The on-device model offers 32,768 at most,
                // so this combination is never written. The installer flag
                // is different: it leaves a stored Smart channel as it is.
                updatePersonality.channel = DIRECT_CHANNEL;
            } else if (this.showSmartChannelControl) {
                updatePersonality.channel = parseChatChannel(
                    String(this.personalityForm.controls["channel"].value),
                );
            }
            updatePersonality.assignDialog(this.dialogFromForm());
            this.voiceAssistantService.updatePersonalityById(updatePersonality);
        }
        this.uuid = undefined;
    };

    providerOptionValue(model: AssistantModel): string {
        return providerOptionValueFor(model, this.storedProviderRef);
    }

    needsAttention = (personalityId: string): boolean => {
        return this.attentionFor(personalityId) != null;
    };

    attentionLabel = (personalityId: string): string => {
        return this.attentionFor(personalityId)?.notice ?? MISSING_KEY_MARK;
    };

    /**
     * Smart is offered when the installer left it on and the selected model
     * can run it. The on-device model cannot: Hermes needs a context window
     * of at least 64000 tokens, and that model offers 32768 at most.
     */
    get showSmartChannelControl(): boolean {
        return (
            showSmartChannelControl(this.smartChatsEnabled) &&
            !this.offlineModelSelected
        );
    }

    /**
     * The dialog's model control, resolved against the offered rows.
     * The offline capability marks the on-device model; the name is not used.
     */
    get offlineModelSelected(): boolean {
        if (this.personalityForm == null) {
            return false;
        }
        const selection = String(
            this.personalityForm.controls["assistantModel"].value,
        );
        const model = resolveProvider(
            providerRefFromSelection(selection).providerRef,
            this.selectionModels,
        );
        return model != null && isOfflineModel(model);
    }

    /** Smart when that control is shown, otherwise Direct. */
    private defaultChannel() {
        return this.showSmartChannelControl ? SMART_CHANNEL : DIRECT_CHANNEL;
    }

    /**
     * Smart stays on the left and Direct on the right, the order the radio
     * group already used. The right-pointing image is shown only while the
     * control holds direct, so the switch points at the selected side.
     */
    get channelPointsRight(): boolean {
        return (
            this.personalityForm.controls["channel"].value === DIRECT_CHANNEL
        );
    }

    toggleChannel(): void {
        const channel = this.personalityForm.controls["channel"];
        channel.setValue(
            channel.value === SMART_CHANNEL ? DIRECT_CHANNEL : SMART_CHANNEL,
        );
    }

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
        const personality =
            this.uuid == null
                ? undefined
                : this.voiceAssistantService.getPersonality(this.uuid);
        this.selectionModels = providersForSelection(
            retainGoneReference(
                this.models,
                this.storedProviderRef,
                personality?.needsNewModel === true,
            ),
            this.storedProviderRef,
            this.cloudTokenStored,
        );
        this.voiceInputs = voiceInputOptions(
            this.models,
            this.cloudTokenStored,
        );
        this.voiceOutputs = voiceOutputOptions(
            this.models,
            this.cloudTokenStored,
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
                images: raw["images"] === true,
                live: raw["live"] === true,
                idleTimeoutSeconds: Number(raw["idleTimeoutSeconds"]),
                mcp: raw["mcp"] !== false,
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
        const images = imageSwitchAvailability(
            this.personalityForm.controls["toolCalling"].value === true,
            this.personalityForm.controls["mcp"].value !== false,
        );
        this.setBlocked(
            this.personalityForm.controls["images"],
            images.disabled,
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
        this.imageReason = images.reason;
        this.retiredNotice = this.retiredNoticeForSelection();
        this.keepOnDeviceModelOnDirect();
    }

    /**
     * Selecting the on-device model while Smart is chosen moves the channel
     * back to Direct. Copying a stored personality into the form does not:
     * an existing Smart plus on-device row is left as it was stored.
     */
    private keepOnDeviceModelOnDirect(): void {
        const selection = String(
            this.personalityForm.controls["assistantModel"].value,
        );
        const previous = this.seenAssistantModel;
        this.seenAssistantModel = selection;
        if (
            this.retainStoredChannel ||
            previous === null ||
            previous === selection
        ) {
            return;
        }
        if (!this.offlineModelSelected) {
            return;
        }
        const channel = this.personalityForm.controls["channel"];
        if (channel.value === SMART_CHANNEL) {
            channel.setValue(DIRECT_CHANNEL, {emitEvent: false});
        }
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
        if (options.length === 0) {
            return;
        }
        const current = String(control.value);
        if (!options.some((option) => option.id === current)) {
            control.setValue(fallback, {emitEvent: false});
        }
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
}
