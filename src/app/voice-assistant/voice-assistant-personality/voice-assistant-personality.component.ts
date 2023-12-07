import {Component, OnInit} from "@angular/core";
import {VoiceAssistantService} from "../../shared/services/voice-assistant.service";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {Observable} from "rxjs";
import {Router} from "@angular/router";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: ["./voice-assistant-personality.component.css"],
})
export class VoiceAssistantPersonalityComponent implements OnInit {
    personalityIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality.svg";
    subject!: Observable<SidebarElement[]>;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private router: Router,
    ) {}

    ngOnInit() {
        localStorage.setItem("voice-assistant-tab", "personality");

        this.subject = this.voiceAssistantService.getSubject();
    }

    deletePersonality = () => {
        const uuid = this.router.url.split("/").pop();
        if (uuid && this.voiceAssistantService.personalities.length > 0) {
            this.voiceAssistantService.deletePersonalityById(uuid);
            localStorage.setItem("personality", "");
        }
    };
}
