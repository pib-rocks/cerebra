import {Component, OnInit, OnChanges, SimpleChanges} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {MotorService} from "./shared/services/motor.service";
import {VoiceAssistantService} from "./shared/services/voice-assistant.service";
import {ChatService} from "./shared/services/chat.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
    currentRoute: string = "";
    isActiveRoute = false;
    jointControlNavItemGroup = [
        "/joint-control/",
        "/joint-control/head",
        "/joint-control/left-hand",
        "/joint-control/right-hand",
        "/joint-control/left-arm",
        "/joint-control/right-arm",
    ];

    constructor(
        private router: Router,
        private motorService: MotorService,
        private voiceAssistantService: VoiceAssistantService,
        private chatService: ChatService,
    ) {}

    ngOnInit(): void {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.isActiveRoute =
                    event.urlAfterRedirects.includes("joint-control");
            }
        });
    }
}
