import {ChangeDetectionStrategy, Component, Input} from "@angular/core";
import {
    EMPTY_VOICE_STATUS,
    MIC_LABELS,
    PHASE_LABELS,
    VoiceStatus,
} from "src/app/shared/types/voice-status";

/**
 * Live state of the voice turn: microphone, phase, answering transport and the
 * last trace stage. Purely presentational - the chat component maps the signals.
 */
@Component({
    selector: "app-voice-status-strip",
    templateUrl: "./voice-status-strip.component.html",
    styleUrls: ["./voice-status-strip.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class VoiceStatusStripComponent {
    @Input() status: VoiceStatus = EMPTY_VOICE_STATUS;

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
}
