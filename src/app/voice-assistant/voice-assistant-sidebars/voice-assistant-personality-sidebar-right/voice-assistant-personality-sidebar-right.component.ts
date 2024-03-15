import {Component, Input, OnInit} from "@angular/core";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {ActivatedRoute, Params} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
@Component({
    selector: "app-va-personality-sidebar-right",
    templateUrl: "./voice-assistant-personality-sidebar-right.component.html",
    styleUrls: ["./voice-assistant-personality-sidebar-right.component.css"],
})
export class VoiceAssistantPersonalitySidebarRightComponent implements OnInit {
    pauseThresholdMin = 0.1;
    pauseThresholdMax = 3.0;
    nameMinLength = 2;
    nameMaxLength = 255;
    personalityClone!: VoiceAssistant;
    thresholdString: string = "";
    personalityForm!: FormGroup;
    @Input() personalityUUID: String | undefined;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params: Params) => {
            let temp = this.voiceAssistantService.getPersonality(
                params["personalityUuid"],
            );
            if (temp !== undefined) {
                this.personalityClone = temp;
            }
        });
        this.route.params.subscribe((params) => {
            this.updateForm();
        });
    }

    updateForm() {
        this.personalityForm = new FormGroup({
            "persona-name": new FormControl(this.personalityClone.name, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(this.nameMinLength),
                    Validators.maxLength(this.nameMaxLength),
                ],
            }),
            gender: new FormControl(this.personalityClone.gender, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(
                this.personalityClone.pauseThreshold,
                {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.min(this.pauseThresholdMin),
                        Validators.max(this.pauseThresholdMax),
                    ],
                },
            ),
        });
        this.thresholdString = this.personalityClone.pauseThreshold + "s";
    }

    adjustThreshold(step: string) {
        const newValue =
            (Number(this.personalityClone.pauseThreshold) * 10 +
                Number(step) * 10) /
            10;
        this.personalityForm.patchValue({
            pausethreshold: newValue,
        });
        if (this.personalityForm.controls["pausethreshold"].hasError("min")) {
            this.personalityForm.patchValue({
                pausethreshold: this.pauseThresholdMin,
            });
        }
        if (this.personalityForm.controls["pausethreshold"].hasError("max")) {
            this.personalityForm.patchValue({
                pausethreshold: this.pauseThresholdMax,
            });
        }
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
        this.personalityClone.pauseThreshold =
            this.personalityForm.controls["pausethreshold"].value;
        this.updatePersonality();
    }

    deletePersonality = () => {
        if (
            this.personalityClone!.getUUID() &&
            this.voiceAssistantService.personalities.length > 0
        ) {
            this.voiceAssistantService.deletePersonalityById(
                this.personalityClone!.personalityId,
            );
        }
    };

    updatePersonality() {
        if (this.personalityForm.valid) {
            this.personalityClone.name =
                this.personalityForm.controls["persona-name"].value;
            this.personalityClone.gender =
                this.personalityForm.controls["gender"].value;
            this.voiceAssistantService.updatePersonalityById(
                this.personalityClone!,
            );
        } else {
            // @TODO Throw error
            console.log("Persona could not be saved, invalid input");
        }
    }
}
