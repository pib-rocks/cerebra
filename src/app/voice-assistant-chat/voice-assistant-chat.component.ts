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
    chatTopics: string[] = [
        "Short stories",
        "Nürnberg",
        "Definition of AI today",
    ];
    chatIcon: string = "../../assets/voice-assistant-svgs/chat/chat_add.svg";
    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_add.svg",
            activeIcon:
                "../../assets/voice-assistant-svgs/chat/chat_add_active.svg",
            label: "ADD",
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_add.svg",
            activeIcon:
                "../../assets/voice-assistant-svgs/chat/chat_add_active.svg",
            label: "DELETE",
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_add.svg",
            activeIcon:
                "../../assets/voice-assistant-svgs/chat/chat_add_active.svg",
            label: "EDIT",
        },
    ];
    sendButton: string = "M120-160v-240l320-80-320-80v-240l760 320-760 320Z";
    message: string = "";
    messages: string[] = [];

    sendMessage = () => {
        if (this.message.trim() != "") {
            this.messages.push(this.message);
        }
        this.message = "";
    };
}
