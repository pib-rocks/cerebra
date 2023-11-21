import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: "app-voice-assistant",
    templateUrl: "./voice-assistant.component.html",
    styleUrls: ["./voice-assistant.component.css"],
})
export class VoiceAssistantComponent implements OnInit {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.router.navigate(
            [localStorage.getItem("voice-assistant-tab") ?? "personality"],
            {relativeTo: this.route},
        );
    }
}
