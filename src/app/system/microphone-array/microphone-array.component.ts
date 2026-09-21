import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {
    MicrophoneArrayService,
    MicrophoneArrayHealthViewModel,
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
    health: MicrophoneArrayHealthViewModel | null = null;
    telemetry: MicrophoneArrayTelemetryViewModel | null = null;
    tuning: MicrophoneArrayViewModel | null = null;

    loading = false;
    healthLoading = true;
    telemetryLoading = true;
    saving = false;
    healthError: string | null = null;
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

    private readonly subscriptions = new Subscription();
    private lastConnectionState: string | null = null;

    constructor(
        private microphoneArrayService: MicrophoneArrayService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.microphoneArrayService
                .getTelemetry()
                .subscribe((telemetry) => {
                    this.telemetry = telemetry;
                    this.telemetryLoading = false;
                    if (telemetry.connectionState !== "live") {
                        this.tuning = null;
                    }
                    if (
                        telemetry.connectionState === "live" &&
                        this.lastConnectionState !== "live"
                    ) {
                        this.loadTuning();
                    }
                    this.lastConnectionState = telemetry.connectionState;
                    this.cdr.markForCheck();
                }),
        );
        this.microphoneArrayService.connect();
        this.refreshAll();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.microphoneArrayService.disconnect();
    }

    get doaAngle(): number | null {
        const angle = this.telemetry?.doaAngle;
        return angle === undefined ? null : angle;
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

    get rosbridgeSource(): string {
        switch (this.telemetry?.connectionState) {
            case "live":
                return "Live via rosbridge";
            case "connecting":
                return "Connecting to rosbridge";
            default:
                return "Rosbridge not reachable";
        }
    }

    get tuningSource(): string {
        return this.telemetry?.connectionState === "live"
            ? "Live via rosbridge"
            : "Rosbridge not reachable";
    }

    get legacySource(): string {
        return this.health?.simulation
            ? "Backend legacy/simulation answer"
            : "Backend owner/legacy facts";
    }

    channelLabel(index: number): string {
        return index === 0 ? "RMS" : "Peak";
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
        this.loading = this.telemetry?.connectionState === "live";
        this.healthLoading = true;
        this.healthError = null;
        this.error = null;
        this.cdr.markForCheck();

        this.subscriptions.add(
            this.microphoneArrayService.getHealth().subscribe({
                next: (health) => {
                    this.health = health;
                    this.healthLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.health = null;
                    this.healthLoading = false;
                    this.healthError =
                        "Failed to load microphone array health information.";
                    this.cdr.markForCheck();
                },
            }),
        );

        if (this.telemetry?.connectionState === "live") {
            this.loadTuning();
        }
    }

    onPresetChange(preset: MicrophoneArrayPreset): void {
        if (this.tuning) {
            this.tuning.preset = preset;
        }
        this.applyTuningUpdate({preset});
    }

    onDspChange(
        name: keyof NonNullable<MicrophoneArrayTuningUpdate["parameters"]>,
    ): void {
        if (!this.tuning) {
            return;
        }
        const values: Record<
            keyof NonNullable<MicrophoneArrayTuningUpdate["parameters"]>,
            number | undefined
        > = {
            HPFONOFF: this.tuning.highPassFilter,
            AGCONOFF: this.toApiBoolean(this.tuning.agcEnabled),
            AGCMAXGAIN: this.tuning.agcMaxGain,
            AGCDESIREDLEVEL: this.tuning.agcDesiredLevel,
            AGCTIME: this.tuning.agcTime,
            STATNOISEONOFF: this.toApiBoolean(
                this.tuning.stationaryNoiseSuppression,
            ),
            NONSTATNOISEONOFF: this.toApiBoolean(
                this.tuning.nonStationaryNoiseSuppression,
            ),
            ECHOONOFF: this.toApiBoolean(this.tuning.echoEnabled),
            STATNOISEONOFF_SR: this.toApiBoolean(
                this.tuning.stationaryNoiseSuppressionSr,
            ),
            NONSTATNOISEONOFF_SR: this.toApiBoolean(
                this.tuning.nonStationaryNoiseSuppressionSr,
            ),
        };
        const value = values[name];
        if (value !== undefined) {
            this.applyTuningUpdate({parameters: {[name]: value}});
        }
    }

    onLedChange(
        name: keyof NonNullable<MicrophoneArrayTuningUpdate["led_ring"]>,
    ): void {
        if (!this.tuning) {
            return;
        }
        const values = {
            mode: this.tuning.ledMode,
            brightness: this.tuning.ledBrightness,
            color: this.tuning.ledColor,
            vad_led:
                this.tuning.vadLed === undefined
                    ? undefined
                    : this.tuning.vadLed
                    ? 1
                    : 0,
        };
        const value = values[name];
        if (value !== undefined) {
            this.applyTuningUpdate({led_ring: {[name]: value}});
        }
    }

    applyTuningUpdate(update: MicrophoneArrayTuningUpdate): void {
        this.saving = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.subscriptions.add(
            this.microphoneArrayService.updateTuning(update).subscribe({
                next: (tuning) => {
                    this.tuning = tuning;
                    this.saving = false;
                    this.successMessage = "Tuning updated.";
                    this.cdr.markForCheck();
                },
                error: (error: Error) => {
                    this.saving = false;
                    this.error = error.message;
                    if (this.telemetry?.connectionState === "live") {
                        this.loadTuning(true);
                    }
                    this.cdr.markForCheck();
                },
            }),
        );
    }

    private toApiBoolean(value: boolean | undefined): 0 | 1 | undefined {
        return value === undefined ? undefined : value ? 1 : 0;
    }

    private loadTuning(preserveError = false): void {
        this.loading = true;
        this.subscriptions.add(
            this.microphoneArrayService.getTuning().subscribe({
                next: (tuning) => {
                    this.tuning = tuning;
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: (error: Error) => {
                    this.tuning = null;
                    this.loading = false;
                    if (!preserveError) {
                        this.error = error.message;
                    }
                    this.cdr.markForCheck();
                },
            }),
        );
    }
}
