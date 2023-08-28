import {Component} from "@angular/core";

@Component({
    selector: "app-voice-assistant-chat",
    templateUrl: "./voice-assistant-chat.component.html",
    styleUrls: [
        "./voice-assistant-chat.component.css",
        "../camera/camera.component.css",
    ],
})
export class VoiceAssistantChatComponent {
    message: String = "";
    messages: String[] = [];

    sendMessage = () => {
        this.messages.push(this.message);
        this.message = "";
    };
}
