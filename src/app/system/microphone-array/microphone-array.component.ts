import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {
    MicrophoneArrayService,
    MicrophoneArrayTelemetry,
    MicrophoneArrayTuning,
    MicrophoneArrayPreset,
    LedRingMode,
    HighPassFilterValue,
} from "./microphone-array.service";

export interface PresetOption {
    value: MicrophoneArrayPreset;
    label: string;
}

export interface LedModeOption {
    value: LedRingMode;
    label: string;
}

export interface HighPassOption {
    value: HighPassFilterValue;
    label: string;
}

const DEFAULT_TUNING: MicrophoneArrayTuning = {
    preset: "standard",
    agc_enabled: true,
    agc_max_gain: 30,
    agc_target_level: 0.005,
    stationary_noise_suppression: true,
    non_stationary_noise_suppression: true,
    aec_enabled: true,
    high_pass_filter: 1,
    led_mode: "doa_trace",
    led_brightness: 50,
    led_color: "#e83e8c",
};

const DEFAULT_TELEMETRY: MicrophoneArrayTelemetry = {
    doa_angle: 0,
    voice_activity: false,
    speech_detected: false,
    audio_levels: [0, 0, 0, 0, 0],
};

const CHANNEL_LABELS = ["Master", "Mic 1", "Mic 2", "Mic 3", "Mic 4"];

@Component({
    selector: "app-microphone-array",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./microphone-array.component.html",
    styleUrls: ["./microphone-array.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophoneArrayComponent implements OnInit, OnDestroy {
    telemetry: MicrophoneArrayTelemetry = {...DEFAULT_TELEMETRY};
    tuning: MicrophoneArrayTuning = {...DEFAULT_TUNING};

    loading = false;
    saving = false;
    error: string | null = null;
    successMessage: string | null = null;

    readonly channelLabels = CHANNEL_LABELS;

    readonly presets: PresetOption[] = [
        {value: "standard", label: "Standard"},
        {value: "noisy_asr", label: "Noisy Environment / ASR"},
        {value: "loud_speaker", label: "Loud Speaker Playback"},
        {value: "raw", label: "Raw"},
        {value: "custom", label: "Custom"},
    ];

    readonly ledModes: LedModeOption[] = [
        {value: "doa_trace", label: "DOA Trace"},
        {value: "pulse", label: "Pulse"},
        {value: "solid", label: "Solid Color"},
        {value: "mute", label: "Mute"},
        {value: "off", label: "Off"},
    ];

    readonly highPassOptions: HighPassOption[] = [
        {value: 0, label: "Off"},
        {value: 1, label: "70Hz"},
        {value: 2, label: "125Hz"},
        {value: 3, label: "150Hz"},
    ];

    private telemetryTimer: ReturnType<typeof setInterval> | null = null;
    private readonly telemetryIntervalMs = 500;

    constructor(
        private microphoneArrayService: MicrophoneArrayService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.refreshAll();
        this.startTelemetryPolling();
    }

    ngOnDestroy(): void {
        this.stopTelemetryPolling();
    }

    get doaAngle(): number {
        const angle = this.telemetry?.doa_angle ?? 0;
        return ((angle % 360) + 360) % 360;
    }

    /** SVG needle rotation: 0° = up (north), clockwise. */
    get doaNeedleTransform(): string {
        return `rotate(${this.doaAngle} 100 100)`;
    }

    getAudioLevelPercent(index: number): number {
        const levels = this.telemetry?.audio_levels ?? [];
        const raw = levels[index] ?? 0;
        const clamped = Math.max(0, Math.min(1, raw));
        return Math.round(clamped * 100);
    }

    getTargetLevelDbov(): number {
        const linear = this.tuning.agc_target_level || 1e-8;
        return Math.round(10 * Math.log10(linear) * 10) / 10;
    }

    setTargetLevelDbov(dbov: number): void {
        const clamped = Math.max(-80, Math.min(0, Number(dbov)));
        this.tuning.agc_target_level = Math.pow(10, clamped / 10);
        this.markCustomIfNeeded();
        this.cdr.markForCheck();
    }

    refreshAll(): void {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        this.microphoneArrayService.getTuning().subscribe({
            next: (tuning) => {
                this.tuning = {...DEFAULT_TUNING, ...tuning};
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.error = "Failed to load microphone array tuning.";
                this.loading = false;
                this.cdr.markForCheck();
            },
        });

        this.fetchTelemetry();
    }

    onPresetChange(preset: MicrophoneArrayPreset): void {
        this.tuning.preset = preset;
        this.applyTuningUpdate({preset});
    }

    onDspChange(): void {
        this.markCustomIfNeeded();
        this.applyTuningUpdate({
            agc_enabled: this.tuning.agc_enabled,
            agc_max_gain: this.tuning.agc_max_gain,
            agc_target_level: this.tuning.agc_target_level,
            stationary_noise_suppression:
                this.tuning.stationary_noise_suppression,
            non_stationary_noise_suppression:
                this.tuning.non_stationary_noise_suppression,
            aec_enabled: this.tuning.aec_enabled,
            high_pass_filter: this.tuning.high_pass_filter,
            preset: this.tuning.preset,
        });
    }

    onLedChange(): void {
        this.applyTuningUpdate({
            led_mode: this.tuning.led_mode,
            led_brightness: this.tuning.led_brightness,
            led_color: this.tuning.led_color,
        });
    }

    applyTuningUpdate(
        update: Partial<MicrophoneArrayTuning>,
    ): void {
        this.saving = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.microphoneArrayService.updateTuning(update).subscribe({
            next: (tuning) => {
                this.tuning = {...DEFAULT_TUNING, ...tuning};
                this.saving = false;
                this.successMessage = "Tuning updated.";
                this.cdr.markForCheck();
            },
            error: () => {
                this.saving = false;
                this.error = "Failed to update microphone array tuning.";
                this.cdr.markForCheck();
            },
        });
    }

    private markCustomIfNeeded(): void {
        if (this.tuning.preset !== "custom") {
            this.tuning.preset = "custom";
        }
    }

    private startTelemetryPolling(): void {
        this.stopTelemetryPolling();
        this.telemetryTimer = setInterval(() => {
            this.fetchTelemetry();
        }, this.telemetryIntervalMs);
    }

    private stopTelemetryPolling(): void {
        if (this.telemetryTimer) {
            clearInterval(this.telemetryTimer);
            this.telemetryTimer = null;
        }
    }

    private fetchTelemetry(): void {
        this.microphoneArrayService.getTelemetry().subscribe({
            next: (telemetry) => {
                this.telemetry = {
                    ...DEFAULT_TELEMETRY,
                    ...telemetry,
                    audio_levels:
                        telemetry.audio_levels?.length === 5
                            ? telemetry.audio_levels
                            : DEFAULT_TELEMETRY.audio_levels,
                };
                this.cdr.markForCheck();
            },
            error: () => {
                // Keep last known telemetry; surface soft error only if none yet.
                if (!this.telemetry) {
                    this.error = "Failed to load microphone array telemetry.";
                    this.cdr.markForCheck();
                }
            },
        });
    }
}
