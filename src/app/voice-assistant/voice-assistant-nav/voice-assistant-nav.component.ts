import {Component} from "@angular/core";
import {FormControl} from "@angular/forms";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {VoiceAssistantMsg} from "../../shared/ros-message-types/voiceAssistant";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: ["./voice-assistant-nav.component.css"],
})
export class VoiceAssistantNavComponent {
    constructor(private rosService: RosService) {}

    voiceAssistantActivationToggle = new FormControl(false);
    voiceAssistantActiveStatus = false;
    toggleVoiceAssistantActivation() {
        this.voiceAssistantActiveStatus = !this.voiceAssistantActiveStatus;
        this.rosService.sendVoiceActivationMessage({
            activationFlag: this.voiceAssistantActiveStatus,
        } as VoiceAssistantMsg);
    }
}
