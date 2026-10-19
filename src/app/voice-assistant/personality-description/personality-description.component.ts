import {
    Component,
    Input,
    OnInit,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";
import {
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    effectiveChannel,
    identityText,
} from "src/app/shared/types/channel-router";

/** Identity editor shown in the personality header's description modal. */
@Component({
    selector: "app-personality-description",
    templateUrl: "./personality-description.component.html",
    styleUrls: ["./personality-description.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class PersonalityDescriptionComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    /** The personality the header modal edits. */
    @Input() personalityId: string | null = null;

    personality?: VoiceAssistant;
    textAreaContent: string = "";
    smartChatsEnabled = true;
    timer: any;

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private channelCapability: ChannelCapabilityService,
    ) {}

    ngOnInit(): void {
        this.channelCapability.smartChatsEnabled$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((enabled) => {
                this.smartChatsEnabled = enabled;
            });
        this.loadPersonality();
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

    private loadPersonality(): void {
        if (this.personalityId == null || this.personalityId === "") {
            return;
        }
        this.personality = this.voiceAssistantService.getPersonality(
            this.personalityId,
        );
        this.textAreaContent = this.personality?.description ?? "";
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

    onIdentityInput(event: Event): void {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
            return;
        }
        this.textAreaContent = target.value;
        this.updateDescription();
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
