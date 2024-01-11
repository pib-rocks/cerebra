import {Component, OnInit} from "@angular/core";
import {FormControl} from "@angular/forms";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {Router} from "@angular/router";
import {SetVoiceAssistantStateRequest} from "src/app/shared/ros-message-types/SetVoiceAssistantState";
import {VoiceAssistantState} from "src/app/shared/ros-message-types/VoiceAssistantState";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: ["./voice-assistant-nav.component.css"],
})
export class VoiceAssistantNavComponent implements OnInit {
    constructor(
        private rosService: RosService,
        private router: Router,
    ) {}

    CHAT_ROUTE_PATTERN = /^\/voice-assistant\/chat\/([a-zA-Z0-9-]+$)/;

    voiceAssistantActivationToggle = new FormControl(false);
    voiceAssistantActiveStatus = false;

    ngOnInit() {
        this.rosService.voiceAssistantStateReceiver$.subscribe(
            (state: VoiceAssistantState) => {
                console.info("received state: " + state);
                this.voiceAssistantActivationToggle.setValue(state.turned_on);
            },
        );
    }

    toggleVoiceAssistantActivation() {
        let turnedOn = !this.voiceAssistantActivationToggle.value;
        let nextState: VoiceAssistantState = {
            turned_on: turnedOn,
            chat_id: "",
        };

        if (turnedOn) {
            const match = this.CHAT_ROUTE_PATTERN.exec(this.router.url);
            if (match) {
                nextState.chat_id = match[1];
            } else {
                this.voiceAssistantActivationToggle.setValue(false);
                throw new Error("no chat selected");
            }
        }

        this.rosService.setVoiceAssistantState(nextState).subscribe({
            next: () => {
                this.voiceAssistantActiveStatus = turnedOn;
            },
            error: (error) => {
                this.voiceAssistantActivationToggle.setValue(!turnedOn);
                throw error;
            },
        });
    }
}
