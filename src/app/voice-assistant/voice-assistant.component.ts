import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {SidebarElement} from "../shared/interfaces/sidebar-element.interface";
import {Observable} from "rxjs";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";

@Component({
    selector: "app-voice-assistant",
    templateUrl: "./voice-assistant.component.html",
    styleUrls: ["./voice-assistant.component.css"],
})
export class VoiceAssistantComponent implements OnInit {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private voiceAssistantService: VoiceAssistantService,
    ) {}

    imgSrc: string = "../../assets/toggle-switch-left.png";
    subject!: Observable<SidebarElement[]>;

    addNewPersonality = () => {
        throw Error("not implemented");
    };

    button: {enabled: boolean; func: () => void} = {
        enabled: true,
        func: this.addNewPersonality,
    };

    ngOnInit(): void {
        this.router.navigate(
            [localStorage.getItem("voice-assistant-tab") ?? "personality"],
            {relativeTo: this.route},
        );
        this.subject = this.voiceAssistantService.getSubject();
    }

    toggleVoiceAssistant() {
        throw Error("not implemented");
    }
}
