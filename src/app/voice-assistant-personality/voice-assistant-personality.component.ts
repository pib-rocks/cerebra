import {Component, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

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
    personalities = [
        {description: "Eva", active: true, hovered: false},
        {description: "Thomas", active: false, hovered: false},
        {description: "Janina", active: false, hovered: false},
        {description: "Georg", active: false, hovered: false},
    ];
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

    constructor(private modalService: NgbModal) {}

    executeSidebarHeaderButtonFunctionality(label: string) {
        if (label == "ADD" || label == "EDIT") {
            this.headerButtonLabel = label;
            if (label == "EDIT") {
                //Todo: Add values of active personality to formControl
            }
            this.modalService
                .open(this.modalContent, {
                    ariaLabelledBy: "modal-basic-title",
                    size: "sm",
                    windowClass: "myCustomModalClass",
                    backdropClass: "myCustomBackdropClass",
                })
                .result.then(
                    (result) => {
                        if (this.allInputsValid()) {
                            //Todo: Make service call
                        }
                    },
                    (reason) => {
                        //Todo: Error handling
                    },
                );
        } else if (label == "DELETE") {
            //ToDo: Implement delete button logic
            return;
        }
    }

    allInputsValid() {
        const thresholdInput = this.pauseThresholdFormControl.value.substring(
            0,
            this.pauseThresholdFormControl.value.length - 1,
        );
        return (
            this.nameFormControl.value != undefined &&
            this.nameFormControl.value != "" &&
            this.validPauseThresholdPattern.test(thresholdInput) &&
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
        console.log(thresholdValue);
    }
}
