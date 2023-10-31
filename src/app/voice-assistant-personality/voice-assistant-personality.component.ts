import {
    Component,
    EventEmitter,
    Output,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {VoiceAssistant} from "../shared/types/voice-assistant";
import {voiceAssistantGenderValidator} from "../shared/validators";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: ["./voice-assistant-personality.component.css"],
})
export class VoiceAssistantPersonalityComponent {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    tabTitle = "PERSONALITY";
    personalityIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality.svg";
    activeIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality_active.svg";
    personalities: {
        id: string;
        name: string;
        selected: boolean;
        hovered: boolean;
    }[] = [];
    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_add.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/personality/personality_add_active.svg",
            label: "ADD",
            hovered: false,
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_delete.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/personality/personality_delete_active.svg",
            label: "DELETE",
            hovered: false,
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_edit.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/personality/personality_edit_active.svg",
            label: "EDIT",
            hovered: false,
        },
    ];
    validPauseThresholdPattern: RegExp = /^(0\.[1-9]\d*|1\.0*)$/;
    nameFormControl: FormControl = new FormControl();
    genderFormControl: FormControl = new FormControl("");
    pauseThresholdFormControl: FormControl<number> = new FormControl();
    descriptionFormControl: FormControl = new FormControl(null);

    saveButton: boolean = false;
    saveAsButton: boolean = false;
    headerButtonLabel: string | undefined;
    thresholdString: string | undefined;
    activePersonality: VoiceAssistant | undefined;
    lastSelectedId: string = "";

    @Output() test = new EventEmitter<object[]>();

    constructor(
        private modalService: NgbModal,
        private voiceAssistantService: VoiceAssistantService,
    ) {
        this.subscribeToLastSelectedIdFromService();
        this.subscribeToServicePersonalitiesBehaviorSubject();
    }

    ngOnInit() {
        this.nameFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
        ]);

        this.genderFormControl.setValidators([
            Validators.required,
            voiceAssistantGenderValidator(this.genderFormControl.value),
        ]);

        this.pauseThresholdFormControl.setValidators([
            Validators.required,
            Validators.pattern(this.validPauseThresholdPattern),
        ]);
    }

    executeSidebarHeaderButtonFunctionality(label: string) {
        this.headerButtonLabel = label;
        let VoiceAssistantRequestObject: VoiceAssistant;

        if (label == "DELETE") {
            this.deletePersonality();
            return;
        } else if (label == "ADD") {
            this.prepareAddFormControl();
        } else if (label == "EDIT") {
            this.prepareEditFormControl();
        }
        this.showModal().result.then(
            (result) => {
                if (this.allInputsValid()) {
                    VoiceAssistantRequestObject = result;
                    if (label == "ADD") {
                        this.voiceAssistantService.createPersonality(
                            VoiceAssistantRequestObject,
                        );
                    } else {
                        this.voiceAssistantService.updatePersonalityById(
                            VoiceAssistantRequestObject,
                        );
                    }
                }
            },
            (reason) => {
                console.log(
                    "Modal dismissed by " + this.getModalDismissReason(reason),
                );
            },
        );
    }

    private getModalDismissReason(reason: any) {
        if (reason == 1 || reason == 0) {
            reason =
                reason == 1
                    ? "pressing esc button"
                    : "clicking outside the modal";
        }
        return reason;
    }

    private deletePersonality() {
        if (this.activePersonality) {
            this.voiceAssistantService.deletePersonalityById(
                this.activePersonality?.personalityId,
            );
        }
    }

    private prepareAddFormControl() {
        this.nameFormControl.setValue("");
        this.descriptionFormControl.setValue(null);
        this.pauseThresholdFormControl.setValue(0);
        this.thresholdString = "";
        this.genderFormControl.setValue("");
    }

    private prepareEditFormControl() {
        if (this.activePersonality != undefined) {
            this.nameFormControl.setValue(this.activePersonality.name);
            this.descriptionFormControl.setValue(
                this.activePersonality.description == ""
                    ? null
                    : this.activePersonality.description,
            );
            this.genderFormControl.setValue(this.activePersonality.gender);
            this.pauseThresholdFormControl.setValue(
                this.activePersonality.pauseThreshold,
            );
        }
    }

    private showModal() {
        return this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        });
    }

    private allInputsValid() {
        return (
            this.nameFormControl.value != undefined &&
            this.nameFormControl.value != "" &&
            this.validPauseThresholdPattern.test(
                "" + this.pauseThresholdFormControl.value,
            ) &&
            (this.genderFormControl.value.toLowerCase() == "male" ||
                this.genderFormControl.value.toLowerCase() == "female")
        );
    }

    private subscribeToLastSelectedIdFromService() {
        this.voiceAssistantService.lastSelectedIdSubject.subscribe(
            (id) => (this.lastSelectedId = id),
        );
    }

    private subscribeToServicePersonalitiesBehaviorSubject() {
        this.voiceAssistantService.personalitiesSubject.subscribe(
            (personalities) => {
                this.personalities = [];
                personalities.forEach((dbPersonality) => {
                    const personality = {
                        id: dbPersonality.personalityId,
                        name: dbPersonality.name,
                        selected:
                            dbPersonality.personalityId == this.lastSelectedId,
                        hovered: false,
                    };
                    this.personalities.push(personality);
                });
                const personality_active = this.personalities.find(
                    (personality) => personality.selected,
                );
                if (personality_active == undefined) {
                    this.activateNewPersonality(this.personalities[0]?.id);
                } else {
                    this.activateNewPersonality(personality_active.id);
                }
            },
        );
    }

    private setPauseThresholdString() {
        if (this.activePersonality && this.activePersonality.pauseThreshold) {
            this.thresholdString = this.activePersonality.pauseThreshold + "s";
        }
    }

    switchGender(id: string) {
        this.genderFormControl.setValue(id);
    }

    adjustThreshold(id: string) {
        let thresholdValue = this.pauseThresholdFormControl.value * 10;
        if (id == "up" && thresholdValue < 10) {
            thresholdValue++;
        } else if (id == "down" && thresholdValue > 0) {
            thresholdValue--;
        }

        this.pauseThresholdFormControl.setValue(thresholdValue / 10);
        this.thresholdString = thresholdValue / 10 + "s";
    }

    activateNewPersonality(id: string) {
        this.activePersonality = this.voiceAssistantService.personalities.find(
            (personality) => personality.personalityId === id,
        );

        for (const personality of this.personalities) {
            personality.selected = id === personality.id;
        }
        this.setPauseThresholdString();
        this.voiceAssistantService.lastSelectedIdSubject.next(id);
    }

    closeModalWithResult(modal: NgbActiveModal) {
        const personalityId = this.activePersonality?.personalityId
            ? this.activePersonality.personalityId
            : "";
        const personality: VoiceAssistant = {
            personalityId: this.headerButtonLabel == "ADD" ? "" : personalityId,
            name: this.nameFormControl.value,
            description: this.descriptionFormControl.value,
            gender: this.genderFormControl.value,
            pauseThreshold: this.pauseThresholdFormControl.value,
        };
        modal.close(personality);
    }
}
