import {Component} from "@angular/core";
import {FormControl} from "@angular/forms";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: [
        "./voice-assistant-nav.component.css",
        "../camera/camera.component.css",
        "../nav-bar/nav-bar.component.css",
        "../voice-assistant/voice-assistant.component.css",
    ],
})
export class VoiceAssistantNavComponent {
    voiceAssistantActivationToggle = new FormControl(false);
    voiceAssistantActiveStatus = false;
    voiceAssistantStatus: String = "OFF";
    toggleVoiceAssistantActivation() {
        this.voiceAssistantActiveStatus = !this.voiceAssistantActiveStatus;
        this.voiceAssistantStatus = this.voiceAssistantActiveStatus
            ? "ON"
            : "OFF";
    }
}
