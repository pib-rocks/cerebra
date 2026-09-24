import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ActivatedRoute, Params, RouterLink} from "@angular/router";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right/voice-assistant-personality-sidebar-right.component";

@Component({
    selector: "app-personality-description",
    templateUrl: "./personality-description.component.html",
    styleUrls: ["./personality-description.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        RouterLink,
        ReactiveFormsModule,
        FormsModule,
        VoiceAssistantPersonalitySidebarRightComponent,
    ],
})
export class PersonalityDescriptionComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    personality?: VoiceAssistant;
    textAreaContent: string = "";
    timer: any;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.personality = this.route.snapshot.data["personality"];
        this.route.params
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params: Params) => {
                this.personality = this.voiceAssistantService.getPersonality(
                    params["personalityUuid"],
                );
                this.textAreaContent = this.personality?.description ?? "";
            });
        this.voiceAssistantService.personalitiesSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.personality) {
                    this.personality =
                        this.voiceAssistantService.getPersonality(
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
