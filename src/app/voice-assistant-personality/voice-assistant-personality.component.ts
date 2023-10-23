import {Component} from "@angular/core";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: ["./voice-assistant-personality.component.css"],
})
export class VoiceAssistantPersonalityComponent {
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

    saveButton: boolean = false;
    saveAsButton: boolean = false;
}
