import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export interface MicrophoneArrayTelemetry {
    doa_angle: number;
    voice_activity: boolean;
    speech_detected: boolean;
    /** Master + 4 raw mic channels, typically normalized 0..1 */
    audio_levels: number[];
}

export type MicrophoneArrayPreset =
    | "standard"
    | "noisy_asr"
    | "loud_speaker"
    | "raw"
    | "custom";

export type LedRingMode = "doa_trace" | "pulse" | "solid" | "mute" | "off";

export type HighPassFilterValue = 0 | 1 | 2 | 3;

export interface MicrophoneArrayTuning {
    preset: MicrophoneArrayPreset;
    agc_enabled: boolean;
    agc_max_gain: number;
    agc_target_level: number;
    stationary_noise_suppression: boolean;
    non_stationary_noise_suppression: boolean;
    aec_enabled: boolean;
    high_pass_filter: HighPassFilterValue;
    led_mode: LedRingMode;
    led_brightness: number;
    led_color: string;
}

export type MicrophoneArrayTuningUpdate = Partial<MicrophoneArrayTuning>;

@Injectable({
    providedIn: "root",
})
export class MicrophoneArrayService {
    constructor(private apiService: ApiService) {}

    getTelemetry(): Observable<MicrophoneArrayTelemetry> {
        return this.apiService.get(
            `${UrlConstants.MICROPHONE_ARRAY}/telemetry`,
        );
    }

    getTuning(): Observable<MicrophoneArrayTuning> {
        return this.apiService.get(`${UrlConstants.MICROPHONE_ARRAY}/tuning`);
    }

    updateTuning(
        update: MicrophoneArrayTuningUpdate,
    ): Observable<MicrophoneArrayTuning> {
        return this.apiService.post(
            `${UrlConstants.MICROPHONE_ARRAY}/tuning`,
            update,
        );
    }
}
