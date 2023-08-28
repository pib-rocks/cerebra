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
    voiceAssistantActiveStatus = false;
    voiceAssistantStatus = this.voiceAssistantActiveStatus ? "ON" : "OFF";
}
