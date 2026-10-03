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
    PersonalityDialogValues,
    VoiceBackendOption,
    enforcePersonalityDialog,
    imageSwitchAvailability,
    readPersonalityDialog,
    toolCallingAvailability,
    voiceInputOptions,
    voiceOutputOptions,
} from "../shared/types/personality-dialog";
import {
    DEFAULT_PROVIDER_REF,
    MISSING_KEY_MARK,
    isProviderConfigured,
    isProviderOptionDisabled,
    personalityAttention,
    retiredModelNotice,
    providerOptionValue as providerOptionValueFor,
    providerRefFromSelection,
    providersForSelection,
    resolveProvider,
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
    retiredNotice: string | null = null;
    readonly missingKeyMark = MISSING_KEY_MARK;
    readonly isProviderConfigured = isProviderConfigured;
    readonly isProviderOptionDisabled = isProviderOptionDisabled;
    button: {enabled: boolean; func: () => void} = {
        enabled: true,
        func: () => {
            return;
        },
    };

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
        this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "lg",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
        return this.ngbModalRef;
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
        this.personalityForm.reset({
            gender: "Female",
            pausethreshold: 0.8,
            messageHistory: 10,
            assistantModel: DEFAULT_PROVIDER_REF,
            channel: this.defaultChannel(),
            voiceInput: LOCAL_VOICE_INPUT,
            voiceOutput: LOCAL_VOICE_OUTPUT,
            toolCalling: true,
            images: false,
            live: false,
            idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
            mcp: true,
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
            if (this.showSmartChannelControl) {
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

    get showSmartChannelControl(): boolean {
        return showSmartChannelControl(this.smartChatsEnabled);
    }

    private defaultChannel() {
        return this.showSmartChannelControl ? SMART_CHANNEL : DIRECT_CHANNEL;
    }

    get showIdleTimeout(): boolean {
        const live = this.personalityForm?.controls["live"];
        return live != null && live.value === true;
    }

    private rebuildSelection() {
        this.selectionModels = providersForSelection(
            this.models,
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
        const model = this.resolvedModel();
        if (model == null || model.retired !== true) {
            return null;
        }
        return retiredModelNotice(model);
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
