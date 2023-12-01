import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

@Component({
    selector: "app-personality-description",
    templateUrl: "./personality-description.component.html",
    styleUrls: ["./personality-description.component.css"],
})
export class PersonalityDescriptionComponent implements OnInit {
    personality?: VoiceAssistant;
    textAreaContent: string = "";

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.personality = this.route.snapshot.data["personality"];
        localStorage.setItem(
            "personality",
            this.personality?.personalityId ?? "",
        );
        this.route.params.subscribe((params: Params) => {
            this.personality = this.voiceAssistantService.getPersonality(
                params["uuid"],
            );
            this.textAreaContent = this.personality?.description ?? "";
            localStorage.setItem(
                "personality",
                this.personality?.personalityId ?? "",
            );
        });
    }

    updateDescription() {
        if (this.personality) {
            this.personality.description = this.textAreaContent ?? "";
            this.voiceAssistantService.updatePersonalityById(this.personality);
        }
    }

    exportDescriptionAs() {
        throw Error("not implemented");
    }
}
