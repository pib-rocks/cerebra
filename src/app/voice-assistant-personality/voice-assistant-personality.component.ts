import {Component} from "@angular/core";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: [
        "./voice-assistant-personality.component.css",
        "../camera/camera.component.css",
    ],
})
export class VoiceAssistantPersonalityComponent {
    personalities: string[] = ["Eva", "Thomas", "Janina", "Georg"];
    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_add.svg",
            label: "ADD",
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_delete.svg",
            label: "DELETE",
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_edit.svg",
            label: "EDIT",
        },
    ];
    personalityIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality.svg";
}
