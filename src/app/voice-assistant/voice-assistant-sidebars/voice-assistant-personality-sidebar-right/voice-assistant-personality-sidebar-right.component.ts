import {Component, Input} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
@Component({
    selector: "app-va-personality-sidebar-right",
    templateUrl: "./voice-assistant-personality-sidebar-right.component.html",
    styleUrls: ["./voice-assistant-personality-sidebar-right.component.css"],
})
export class VoiceAssistantPersonalitySidebarRightComponent {
    personalityForm!: FormGroup;
    thresholdString: string | undefined;
    personalityName: string | undefined;
    gender: string | undefined;
    pauseThreshold: number | undefined;
    @Input() personality?: VoiceAssistant;

    ngOnInit() {
        this.personalityName = this.personality!.name;
        this.gender = this.personality!.gender;
        this.pauseThreshold = this.personality!.pauseThreshold;
    }

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
            this.personalityForm.controls["pausethreshold"].value + "s";
    }
}
