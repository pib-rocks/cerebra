import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

@Component({
    selector: "app-personality-description",
    templateUrl: "./personality-description.component.html",
    styleUrls: ["./personality-description.component.scss"],
})
export class PersonalityDescriptionComponent implements OnInit {
    personality?: VoiceAssistant;
    textAreaContent: string = "";
    timer: any;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.personality = this.route.snapshot.data["personality"];
        this.route.params.subscribe((params: Params) => {
            this.personality = this.voiceAssistantService.getPersonality(
                params["personalityUuid"],
            );
            this.textAreaContent = this.personality?.description ?? "";
        });
        this.voiceAssistantService.personalitiesSubject.subscribe(() => {
            if (this.personality) {
                this.personality = this.voiceAssistantService.getPersonality(
                    this.personality?.getUUID(),
                );
            }
        });
    }

    updateDescription() {
        //save description after 1s
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.personality) {
                this.personality.description = this.textAreaContent ?? "";
                this.voiceAssistantService.updatePersonalityById(
                    this.personality,
                );
            }
        }, 1000);
    }
}
