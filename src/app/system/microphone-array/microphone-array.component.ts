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
    MicrophoneArrayTelemetryViewModel,
    MicrophoneArrayTuningUpdate,
    MicrophoneArrayViewModel,
    MicrophoneArrayPreset,
    LedRingMode,
    HighPassFilterValue,
} from "./microphone-array.service";

export interface LedModeOption {
    value: LedRingMode;
    label: string;
}

export interface HighPassOption {
    value: HighPassFilterValue;
    label: string;
}

@Component({
    selector: "app-microphone-array",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./microphone-array.component.html",
    styleUrls: ["./microphone-array.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophoneArrayComponent implements OnInit, OnDestroy {
    telemetry: MicrophoneArrayTelemetryViewModel | null = null;
    tuning: MicrophoneArrayViewModel | null = null;

    loading = false;
    saving = false;
    error: string | null = null;
    successMessage: string | null = null;

    readonly ledModes: LedModeOption[] = [
        {value: "off", label: "Off"},
        {value: "listen", label: "Listen"},
        {value: "speak", label: "Speak"},
        {value: "think", label: "Think"},
        {value: "spin", label: "Spin"},
        {value: "trace", label: "DOA Trace"},
        {value: "mono", label: "Solid Color"},
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

    get doaAngle(): number | null {
        const angle = this.telemetry?.doaAngle;
        if (angle === undefined) {
            return null;
        }
        return ((angle % 360) + 360) % 360;
    }

    /** SVG needle rotation: 0° = up (north), clockwise. */
    get doaNeedleTransform(): string | null {
        if (this.doaAngle === null) {
            return null;
        }
        return `rotate(${this.doaAngle} 100 100)`;
    }

    get audioLevels(): number[] {
        return this.telemetry?.audioLevels ?? [];
    }

    channelLabel(index: number): string {
        return index === 0 ? "Master" : `Mic ${index}`;
    }

    getAudioLevelPercent(raw: number): number {
        const clamped = Math.max(0, Math.min(1, raw));
        return Math.round(clamped * 100);
    }

    getTargetLevelDbov(): number | null {
        const linear = this.tuning?.agcDesiredLevel;
        if (linear === undefined) {
            return null;
        }
        return Math.round(10 * Math.log10(linear) * 10) / 10;
    }

    setTargetLevelDbov(dbov: number): void {
        if (!this.tuning || this.tuning.agcDesiredLevel === undefined) {
            return;
        }
        const clamped = Math.max(-80, Math.min(0, Number(dbov)));
        this.tuning.agcDesiredLevel = Math.pow(10, clamped / 10);
        this.cdr.markForCheck();
    }

    refreshAll(): void {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        this.microphoneArrayService.getTuning().subscribe({
            next: (tuning) => {
                this.tuning = tuning;
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
        if (this.tuning) {
            this.tuning.preset = preset;
        }
        this.applyTuningUpdate({preset});
    }

    onDspChange(): void {
        if (!this.tuning) {
            return;
        }

        const parameters: NonNullable<
            MicrophoneArrayTuningUpdate["parameters"]
        > = {};
        this.setReportedParameter(
            parameters,
            "HPFONOFF",
            this.tuning.highPassFilter,
        );
        this.setReportedParameter(
            parameters,
            "AGCONOFF",
            this.toApiBoolean(this.tuning.agcEnabled),
        );
        this.setReportedParameter(
            parameters,
            "AGCMAXGAIN",
            this.tuning.agcMaxGain,
        );
        this.setReportedParameter(
            parameters,
            "AGCDESIREDLEVEL",
            this.tuning.agcDesiredLevel,
        );
        this.setReportedParameter(parameters, "AGCTIME", this.tuning.agcTime);
        this.setReportedParameter(
            parameters,
            "STATNOISEONOFF",
            this.toApiBoolean(this.tuning.stationaryNoiseSuppression),
        );
        this.setReportedParameter(
            parameters,
            "NONSTATNOISEONOFF",
            this.toApiBoolean(this.tuning.nonStationaryNoiseSuppression),
        );
        this.setReportedParameter(
            parameters,
            "ECHOONOFF",
            this.toApiBoolean(this.tuning.echoEnabled),
        );
        this.setReportedParameter(
            parameters,
            "STATNOISEONOFF_SR",
            this.toApiBoolean(this.tuning.stationaryNoiseSuppressionSr),
        );
        this.setReportedParameter(
            parameters,
            "NONSTATNOISEONOFF_SR",
            this.toApiBoolean(this.tuning.nonStationaryNoiseSuppressionSr),
        );

        this.applyTuningUpdate({parameters});
    }

    onLedChange(): void {
        if (!this.tuning) {
            return;
        }
        this.applyTuningUpdate({
            led_ring: {
                mode: this.tuning.ledMode,
                brightness: this.tuning.ledBrightness,
                color: this.tuning.ledColor,
                vad_led: this.tuning.vadLed ? 1 : 0,
            },
        });
    }

    applyTuningUpdate(update: MicrophoneArrayTuningUpdate): void {
        this.saving = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.microphoneArrayService.updateTuning(update).subscribe({
            next: (tuning) => {
                this.tuning = tuning;
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

    private toApiBoolean(value: boolean | undefined): 0 | 1 | undefined {
        return value === undefined ? undefined : value ? 1 : 0;
    }

    private setReportedParameter<
        K extends keyof NonNullable<MicrophoneArrayTuningUpdate["parameters"]>,
    >(
        parameters: NonNullable<MicrophoneArrayTuningUpdate["parameters"]>,
        name: K,
        value: NonNullable<MicrophoneArrayTuningUpdate["parameters"]>[K],
    ): void {
        if (value !== undefined) {
            parameters[name] = value;
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
                this.telemetry = telemetry;
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
