import {
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ChangeDetectionStrategy,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormControl, Validators, ReactiveFormsModule} from "@angular/forms";
import {
    ActivatedRoute,
    Router,
    RouterOutlet,
    RouterLink,
} from "@angular/router";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Observable, Subject, Subscription} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {ChatService} from "src/app/shared/services/chat.service";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {Chat, ChatDto} from "src/app/shared/types/chat.class";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {VoiceAssistantState} from "../../shared/types/voice-assistant-state";
import {
    TokenProbeState,
    chatStartRefusal,
    effectiveCloudTokenStored,
} from "src/app/shared/types/provider-registry";
import {KeyStoreService} from "src/app/system/keys/key-store.service";
import {Location} from "@angular/common";
import {
    TokenService,
    normalizeTokenStatus,
} from "src/app/shared/services/token.service";
import {SideBarRightComponent} from "../../ui-components/sidebar-right/sidebar-right.component";

@Component({
    selector: "app-voice-assistant-chat",
    templateUrl: "./voice-assistant-chat.component.html",
    styleUrls: ["./voice-assistant-chat.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        RouterOutlet,
        RouterLink,
        SideBarRightComponent,
        ReactiveFormsModule,
    ],
})
export class VoiceAssistantChatComponent implements OnInit, OnDestroy {
    private readonly destroyRef = inject(DestroyRef);
    private readonly changeDetector = inject(ChangeDetectorRef);

    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    personalityIcon: string = "../../assets/voice-assistant-svgs/chat/chat.svg";
    topicFormControl: FormControl = new FormControl("");
    subject!: Observable<SidebarElement[]>;
    personality?: VoiceAssistant;
    personalityId?: string | null;
    uuid: string | undefined;
    selected: Subject<string> = new Subject();
    turnedOn: boolean = false;
    activeChatId: string = "";
    activePersonalityId: string = "";
    currentChatId: string | null = "";
    voiceAssistantActivationToggle = new FormControl(false);
    chatSubjectSubscription!: Subscription;
    voiceAssistantStateSubscription?: Subscription;
    tokenStatusSubscription?: Subscription;
    routeParamMapSubscription?: Subscription;
    smartConnectActive = false;
    cloudTokenStored = false;
    tokenProbe: TokenProbeState = "unknown";
    private probeCloudTokenStored = false;
    private credentialRefs: string[] = [];

    constructor(
        private readonly modalService: NgbModal,
        private readonly router: Router,
        private readonly chatService: ChatService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly route: ActivatedRoute,
        private readonly tokenService: TokenService,
        private readonly keyStore: KeyStoreService,
        location: Location,
    ) {
        location.onUrlChange((url, _state) => {
            const urlArray: string[] = url.split("/");
            this.currentChatId = urlArray[urlArray.length - 1];
        });
    }

    ngOnInit() {
        this.keyStore
            .status()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                this.credentialRefs = status.credentialRefs ?? [];
                this.refreshCloudPresence();
                this.changeDetector.markForCheck();
            });
        this.voiceAssistantService.assistantModelsSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.refreshCloudPresence();
                this.changeDetector.markForCheck();
            });
        // set current state of VA (in case another user is using it)
        this.voiceAssistantStateSubscription =
            this.voiceAssistantService.voiceAssistantStateObservable.subscribe(
                (state: VoiceAssistantState) => {
                    this.voiceAssistantActivationToggle.setValue(
                        state.turnedOn,
                    );
                    this.turnedOn = state.turnedOn;
                    this.activeChatId = state.chatId;
                    const deleteChat = this.dropdownCallbackMethods.find(
                        (e) => e.label === "Delete chat",
                    );
                    if (deleteChat) {
                        deleteChat.disabled = this.turnedOn;
                    }
                    this.chatService
                        .getChatById(state.chatId)
                        .subscribe((chat) => {
                            this.activePersonalityId = chat.personalityId;
                            this.changeDetector.markForCheck();
                        });
                    this.changeDetector.markForCheck();
                },
            );
        this.tokenStatusSubscription = this.tokenService.tokenStatus$.subscribe(
            (response) => {
                const status = normalizeTokenStatus(response);
                this.smartConnectActive =
                    status.tokenExists === true && status.tokenActive === true;
                this.probeCloudTokenStored = status.tokenExists === true;
                this.tokenProbe = status.service;
                this.refreshCloudPresence();
                this.changeDetector.markForCheck();
            },
        );
        this.routeParamMapSubscription = this.route.paramMap.subscribe(
            (_params) => {
                const routeParts: string[] = this.router.url.split("/");
                this.currentChatId = routeParts[routeParts.length - 1];

                this.personalityId = this.router.url
                    .split("/")
                    .find((segment) => RegExp(CerebraRegex.UUID).test(segment));
                this.personality = this.personalityId
                    ? this.voiceAssistantService.getPersonality(
                          this.personalityId,
                      ) ?? this.route.snapshot.params["personality"]
                    : this.route.snapshot.params["personality"];
                if (this.personality) {
                    this.subject = this.chatService.getSubject(
                        this.personality.personalityId,
                    );
                } else {
                    throw Error("undefined personality and subject");
                }
                localStorage.setItem("voice-assistant-tab", "chat");
                this.topicFormControl.setValidators([
                    Validators.required,
                    Validators.maxLength(255),
                ]);
                this.toggleDeleteChat(this.chatService.chats);
            },
        );

        this.chatSubjectSubscription = this.chatService.chatSubject.subscribe(
            (chats) => {
                this.toggleDeleteChat(chats);
            },
        );
    }

    showModal = () => {
        this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
        return this.ngbModalRef;
    };

    openAddModal() {
        this.topicFormControl.setValue("");
        this.showModal();
    }

    openEditModal(uuid: string) {
        this.uuid = uuid;
        if (this.uuid) {
            const updateChat = this.chatService.getChat(this.uuid);
            this.topicFormControl.setValue(updateChat?.topic ?? "");
            this.showModal();
        }
    }

    addChat() {
        if (this.modelChoiceRefusal() != null) {
            return;
        }
        if (this.personalityId) {
            const chat: Observable<Chat> = this.chatService.createChat(
                new ChatDto(this.topicFormControl.value, this.personalityId),
            );
            chat.subscribe((chat) => this.selected.next(chat.chatId));
        } else {
            this.ngbModalRef?.close("failed");
        }
    }

    editChat = () => {
        if (this.uuid) {
            const updateChat = this.chatService.getChat(this.uuid)?.clone();
            if (updateChat) {
                updateChat.topic = this.topicFormControl.value;
                this.chatService.updateChatById(updateChat);
                this.ngbModalRef?.close("edited");
                this.uuid = undefined;
            }
        }
    };

    saveChat() {
        if (this.topicFormControl.valid) {
            if (this.uuid) {
                this.editChat();
            } else {
                this.addChat();
            }
        }
        this.ngbModalRef?.close("saved");
    }

    closeModal = () => {
        this.ngbModalRef?.close("cancelled");
        this.uuid = undefined;
    };

    deleteChat(uudi: string) {
        if (uudi) {
            this.chatService.deleteChatById(uudi);
            localStorage.removeItem("chat");
        }
    }

    /**
     * faster-whisper and Supertone do not use the key store.
     * Degraded mode leaves this control on.
     */
    localVoiceEnabled(): boolean {
        return this.smartConnectActive;
    }

    /**
     * A personality whose model row is gone cannot start a chat or take
     * the voice. The reference stays where it was; the user chooses.
     */
    private modelChoiceRefusal(): string | null {
        const personality =
            (this.personalityId != null
                ? this.voiceAssistantService.getPersonality(this.personalityId)
                : undefined) ?? this.personality;
        if (personality == null) {
            return null;
        }
        const models =
            this.voiceAssistantService.assistantModelsSubject?.getValue() ?? [];
        return chatStartRefusal(
            personality.providerRef,
            models,
            this.cloudTokenStored,
            personality.needsNewModel,
            this.tokenProbe,
        );
    }

    private refreshCloudPresence(): void {
        const models =
            this.voiceAssistantService.assistantModelsSubject?.getValue() ?? [];
        this.cloudTokenStored = effectiveCloudTokenStored(
            this.probeCloudTokenStored,
            models,
            this.credentialRefs,
        );
    }

    toggleVoiceAssistant() {
        const turnedOn = !this.voiceAssistantActivationToggle.value;
        if (turnedOn && this.modelChoiceRefusal() != null) {
            return;
        }
        const nextState: VoiceAssistantState = {turnedOn, chatId: ""};
        if (turnedOn) {
            const match = RegExp(
                `/voice-assistant/${CerebraRegex.UUID}/chat/(${CerebraRegex.UUID})`,
            ).exec(this.router.url);
            if (match) nextState.chatId = match[1];
            else throw new Error("no chat selected");
        }

        this.turnedOn = turnedOn;
        this.activeChatId = nextState.chatId;

        this.voiceAssistantService.setVoiceAssistantState(nextState).subscribe({
            error: (error) => console.error(error),
        });

        const deleteChat = this.dropdownCallbackMethods.find(
            (e) => e.label === "Delete chat",
        );
        if (deleteChat) {
            deleteChat.disabled = this.turnedOn;
        }
    }

    toggleDeleteChat(chats: Chat[]) {
        const filteredChats = chats.filter((chat) => {
            return chat.personalityId === this.personalityId;
        });
        const numberOfChats = filteredChats.length;
        const deleteChat = this.dropdownCallbackMethods.find(
            (e) => e.label === "Delete chat",
        );
        if (deleteChat && !this.turnedOn) {
            deleteChat.disabled = numberOfChats <= 1;
        }
    }

    ngOnDestroy(): void {
        this.chatSubjectSubscription.unsubscribe();
        this.voiceAssistantStateSubscription?.unsubscribe();
        this.tokenStatusSubscription?.unsubscribe();
        this.routeParamMapSubscription?.unsubscribe();
    }

    optionCallbackMethods = [
        {
            icon: "",
            label: "New chat",
            clickCallback: this.openAddModal.bind(this),
            disabled: false,
        },
    ];

    dropdownCallbackMethods = [
        {
            icon: "../../assets/edit.svg",
            label: "Rename",
            clickCallback: this.openEditModal.bind(this),
            disabled: false,
        },
        {
            icon: "../../assets/delete.svg",
            label: "Delete chat",
            clickCallback: this.deleteChat.bind(this),
            disabled: false,
        },
    ];
}
