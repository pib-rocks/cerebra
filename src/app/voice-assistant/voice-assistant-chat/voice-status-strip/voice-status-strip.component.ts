import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from "@angular/core";
import {NgClass} from "@angular/common";
import {
    EMPTY_VOICE_STATUS,
    MIC_LABELS,
    PHASE_LABELS,
    VoiceStatus,
} from "src/app/shared/types/voice-status";
import {
    ProviderHealth,
    healthCssClass,
    healthLabel,
    healthTooltip,
} from "src/app/shared/types/provider-health";

/**
 * Live state of the voice turn: microphone, phase, the provider of the open
 * personality with its health, the answering transport and the last trace
 * stage. Purely presentational - the chat component maps the signals.
 */
@Component({
    selector: "app-voice-status-strip",
    templateUrl: "./voice-status-strip.component.html",
    styleUrls: ["./voice-status-strip.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass],
})
export class VoiceStatusStripComponent {
    @Input() status: VoiceStatus = EMPTY_VOICE_STATUS;

    /**
     * The provider the open personality points at, with its health (PC-115).
     * Shown before the first turn, which is the whole point: the user has to
     * see whether the provider is usable before talking to the robot.
     */
    @Input() provider: ProviderHealth | null = null;

    /** Name shown while the probe has not answered: the catalogue's label. */
    @Input() providerLabel = "";

    /** True only while a probe is in flight. */
    @Input() providerLoading = false;

    /** Asks the chat component to probe again (D4: manual refresh). */
    @Output() providerRefresh = new EventEmitter<void>();

    get micLabel(): string {
        return MIC_LABELS[this.status.mic];
    }

    get phaseLabel(): string {
        return PHASE_LABELS[this.status.phase];
    }

    get lastStageLabel(): string {
        if (!this.status.lastStage) {
            return "";
        }
        const elapsed = this.status.lastStageElapsedMs;
        return elapsed === null
            ? this.status.lastStage
            : `${this.status.lastStage} +${elapsed} ms`;
    }

    /** The chip exists as soon as the personality's provider is known. */
    get showProviderChip(): boolean {
        return this.provider != null || this.providerLabel.trim() !== "";
    }

    get providerName(): string {
        return this.provider?.model?.trim() || this.providerLabel;
    }

    get providerStateClass(): string {
        return healthCssClass(this.provider?.state ?? "unknown");
    }

    get providerStateLabel(): string {
        if (this.providerLoading) {
            return "checking";
        }
        return healthLabel(this.provider);
    }

    get providerTooltip(): string {
        if (this.providerLoading) {
            return `${this.providerName}: checking the provider…`;
        }
        return healthTooltip(this.provider, this.providerName);
    }

    requestProviderRefresh(): void {
        if (this.providerLoading) {
            return;
        }
        this.providerRefresh.emit();
    }
}
