import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
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
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.personality = this.route.snapshot.data["personality"];
        localStorage.setItem(
            "personality",
            this.personality?.personalityId ?? "",
        );
        this.route.params.subscribe((params: Params) => {
            this.personality = this.voiceAssistantService.getPersonality(
                params["personalityUuid"],
            );
            this.textAreaContent = this.personality?.description ?? "";
            localStorage.setItem(
                "personality",
                this.personality?.personalityId ?? "",
            );
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
        if (this.personality) {
            this.personality.description = this.textAreaContent ?? "";
            this.voiceAssistantService.updatePersonalityById(this.personality);
        }
    }

    updatePersonality() {
        if (this.personality) {
            this.voiceAssistantService.uuidSubject.next(
                this.personality?.getUUID(),
            );
        }
    }

    exportDescriptionAs() {
        throw Error("not implemented");
    }

    deletePersonality = () => {
        const uuid = this.router.url
            .split("/")
            .find((segment) => RegExp(CerebraRegex.UUID).test(segment));
        if (uuid && this.voiceAssistantService.personalities.length > 0) {
            this.voiceAssistantService.deletePersonalityById(uuid);
            localStorage.setItem("personality", "");
        }
    };
}
