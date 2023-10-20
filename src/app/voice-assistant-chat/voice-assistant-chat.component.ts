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
    tabTitle = "CHAT";
    exportButtonHovered = false;
    activeIcon = "../../assets/voice-assistant-svgs/chat/chat_active.svg";
    chatTopics = [
        {description: "Short stories", active: true, hovered: false},
        {description: "Nürnberg", active: false, hovered: false},
        {description: "Definition of AI today", active: false, hovered: false},
    ];
    chatIconPaths = {
        icon: "../../assets/voice-assistant-svgs/chat/chat.svg",
    };
    chatIcon: string = "../../assets/voice-assistant-svgs/chat/chat.svg";

    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_add.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/chat/chat_add_active.svg",
            label: "ADD",
            hovered: false,
            clickFunction: this.showAddOrEditModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_delete.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/chat/chat_delete_active.svg",
            label: "DELETE",
            hovered: false,
            clickFunction: this.showAddOrEditModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/chat/chat_edit.svg",
            active_icon:
                "../../assets/voice-assistant-svgs/chat/chat_edit_active.svg",
            label: "EDIT",
            hovered: false,
            clickFunction: this.showAddOrEditModal,
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

    showAddOrEditModal() {
        return;
    }
}
