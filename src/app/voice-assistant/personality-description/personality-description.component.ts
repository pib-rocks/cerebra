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
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";
import {
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    effectiveChannel,
    identityText,
} from "src/app/shared/types/channel-router";
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
    smartChatsEnabled = true;
    timer: any;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private route: ActivatedRoute,
        private channelCapability: ChannelCapabilityService,
    ) {}

    ngOnInit(): void {
        this.channelCapability.smartChatsEnabled$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((enabled) => {
                this.smartChatsEnabled = enabled;
            });
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

    currentChannel() {
        return effectiveChannel(
            this.personality?.channel,
            this.smartChatsEnabled,
        );
    }

    showMemoryNote(): boolean {
        return this.currentChannel() === SMART_CHANNEL;
    }

    identityHint(): string {
        if (this.currentChannel() === DIRECT_CHANNEL) {
            return "This is the only identity for this personality. Direct sends it as the system prompt.";
        }
        return "This is the only identity for this personality. Smart loads it as SOUL.md. MEMORY.md stays on Smart.";
    }

    updateDescription() {
        //save description after 1s
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.personality) {
                this.personality.description = identityText(
                    this.textAreaContent,
                );
                this.voiceAssistantService.updatePersonalityById(
                    this.personality,
                );
            }
        }, 1000);
    }
}
