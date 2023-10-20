import {Component, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {VoiceAssistant} from "../shared/types/voice-assistant";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: [
        "./voice-assistant-personality.component.css",
        "../camera/camera.component.css",
    ],
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
        active: boolean;
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
    nameFormControl: FormControl = new FormControl(
        "",
        Validators.compose([Validators.required, Validators.minLength(2)]),
    );
    genderFormControl: FormControl = new FormControl("", Validators.required);
    pauseThresholdFormControl: FormControl = new FormControl(
        0,
        Validators.compose([
            Validators.required,
            Validators.pattern(this.validPauseThresholdPattern),
        ]),
    );
    descriptionFormControl: FormControl = new FormControl();

    saveButton: boolean = false;
    saveAsButton: boolean = false;
    headerButtonLabel: string | undefined;
    tresholdString: string | undefined;
    activePersonality: VoiceAssistant | undefined;

    constructor(
        private modalService: NgbModal,
        private voiceAssistantService: VoiceAssistantService,
    ) {}

    ngOnInit() {
        this.loadPersonalitiesFromService();
    }

    loadPersonalitiesFromService() {
        for (
            let i = 0;
            i < this.voiceAssistantService.personalities.length;
            i++
        ) {
            const personality = {
                id: this.voiceAssistantService.personalities[i].personalityId,
                name: this.voiceAssistantService.personalities[i].name,
                active: i == 0,
                hovered: false,
            };
            this.personalities.push(personality);
        }
        this.activePersonality = this.voiceAssistantService.personalities[0];
    }

    executeSidebarHeaderButtonFunctionality(label: string) {
        this.headerButtonLabel = label;
        let personalityId: string;
        if (label == "ADD" || label == "EDIT") {
            if (label == "EDIT") {
                if (this.activePersonality != undefined) {
                    this.nameFormControl.setValue(this.activePersonality.name);
                    this.descriptionFormControl.setValue(
                        this.activePersonality.description,
                    );
                    this.genderFormControl.setValue(
                        this.activePersonality.gender,
                    );
                    this.pauseThresholdFormControl.setValue(
                        this.activePersonality.pauseThreshold,
                    );
                    personalityId = this.activePersonality.personalityId;
                } else {
                    //Todo: Ask Jürgen what error message to show here if sidebar list is empty.
                    return;
                }
            }
            this.modalService
                .open(this.modalContent, {
                    ariaLabelledBy: "modal-basic-title",
                    size: "sm",
                    windowClass: "myCustomModalClass",
                    backdropClass: "myCustomBackdropClass",
                })
                .result.then(
                    (result) => {},
                    (reason) => {
                        if (this.allInputsValid()) {
                            const personality: VoiceAssistant = {
                                personalityId: personalityId,
                                name: this.nameFormControl.value,
                                description: this.descriptionFormControl.value,
                                gender: this.genderFormControl.value,
                                pauseThreshold:
                                    this.pauseThresholdFormControl.value,
                            };
                            if (label == "ADD") {
                                this.voiceAssistantService.addPersonality(
                                    personality,
                                );
                            } else {
                                this.voiceAssistantService.updatePersonality(
                                    personality,
                                );
                            }
                        }
                    },
                );
        } else if (label == "DELETE") {
            if (this.activePersonality) {
                this.voiceAssistantService.deletePersonalityById(
                    this.activePersonality?.personalityId,
                );
            }
        }
    }

    allInputsValid() {
        return (
            this.nameFormControl.value != undefined &&
            this.nameFormControl.value != "" &&
            this.validPauseThresholdPattern.test(
                this.pauseThresholdFormControl.value,
            ) &&
            (this.genderFormControl.value == "male" ||
                this.genderFormControl.value == "female")
        );
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
        this.tresholdString = thresholdValue / 10 + "s";
    }

    activateNewPersonality(id: string) {
        for (let personality of this.voiceAssistantService.personalities) {
            if (id == personality.personalityId) {
                this.activePersonality = personality;
                break;
            }
        }

        for (let personality of this.personalities) {
            //Todo: check if this is really necessary
            personality.active = id === personality.id;
        }
    }
}
