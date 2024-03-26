import {Component, Input, OnInit, SimpleChanges} from "@angular/core";
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
    personalityFormSidebar!: FormGroup;
    @Input() personalityUUID: string | undefined;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params: Params) => {
            const temp = this.voiceAssistantService.getPersonality(
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
        this.personalityFormSidebar = new FormGroup({
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
        this.thresholdString = this.personalityClone.pauseThreshold + "";
    }

    adjustThreshold() {
        this.personalityFormSidebar.patchValue({
            pausethreshold: this.thresholdString,
        });
        if (
            this.personalityFormSidebar.controls["pausethreshold"].hasError(
                "min",
            )
        ) {
            this.personalityFormSidebar.patchValue({
                pausethreshold: this.pauseThresholdMin,
            });
        }
        if (
            this.personalityFormSidebar.controls["pausethreshold"].hasError(
                "max",
            )
        ) {
            this.personalityFormSidebar.patchValue({
                pausethreshold: this.pauseThresholdMax,
            });
        }
        this.personalityClone.pauseThreshold = parseFloat(
            this.personalityFormSidebar.controls["pausethreshold"].value,
        );
    }

    adjustThresholdViaButton(up: boolean) {
        let threshold = parseFloat(this.thresholdString);
        if (isNaN(threshold)) {
            return;
        }

        if (up) {
            threshold += 0.1;
        } else {
            threshold -= 0.1;
        }
        this.thresholdString = threshold.toFixed(1) + "";
        this.adjustThreshold();
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

    formChanged(event: any) {
        this.personalityFormSidebar = event;
        this.updatePersonality();
    }

    updatePersonality() {
        if (this.personalityFormSidebar.valid) {
            this.personalityClone.name =
                this.personalityFormSidebar.controls["persona-name"].value;
            this.personalityClone.gender =
                this.personalityFormSidebar.controls["gender"].value;
            this.voiceAssistantService.updatePersonalityById(
                this.personalityClone!,
            );
        } else {
            console.log("Persona could not be saved, invalid input");
        }
    }
}
