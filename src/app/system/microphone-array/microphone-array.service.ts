import {Injectable} from "@angular/core";
import {map, Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export interface MicrophoneArrayTelemetryDocument {
    doa_angle: number;
    voice_activity: boolean;
    speech_detected: boolean;
    audio_levels: number[];
    simulation: boolean;
    error?: string;
}

export type MicrophoneArrayPreset = string;

export type LedRingMode =
    | "off"
    | "listen"
    | "speak"
    | "think"
    | "spin"
    | "trace"
    | "mono";

export type HighPassFilterValue = 0 | 1 | 2 | 3;

export interface MicrophoneArrayParametersDocument {
    HPFONOFF?: HighPassFilterValue;
    AGCONOFF?: 0 | 1;
    AGCMAXGAIN?: number;
    AGCDESIREDLEVEL?: number;
    AGCTIME?: number;
    STATNOISEONOFF?: 0 | 1;
    NONSTATNOISEONOFF?: 0 | 1;
    ECHOONOFF?: 0 | 1;
    STATNOISEONOFF_SR?: 0 | 1;
    NONSTATNOISEONOFF_SR?: 0 | 1;
}

export interface MicrophoneArrayLedRingDocument {
    mode: LedRingMode;
    brightness: number;
    color: string;
    vad_led: 0 | 1;
}

export interface MicrophoneArrayTuningDocument {
    preset: MicrophoneArrayPreset;
    presets: MicrophoneArrayPreset[];
    parameters: MicrophoneArrayParametersDocument;
    led_ring: MicrophoneArrayLedRingDocument;
    simulation: boolean;
}

export interface MicrophoneArrayTuningUpdate {
    preset?: MicrophoneArrayPreset;
    parameters?: Partial<MicrophoneArrayParametersDocument>;
    led_ring?: Partial<MicrophoneArrayLedRingDocument>;
}

export interface MicrophoneArrayTelemetryViewModel {
    doaAngle: number;
    voiceActivity: boolean;
    speechDetected: boolean;
    audioLevels: number[];
    simulation: boolean;
    error?: string;
}

export interface MicrophoneArrayViewModel {
    preset: MicrophoneArrayPreset;
    presets: MicrophoneArrayPreset[];
    simulation: boolean;
    highPassFilter?: HighPassFilterValue;
    agcEnabled?: boolean;
    agcMaxGain?: number;
    agcDesiredLevel?: number;
    agcTime?: number;
    stationaryNoiseSuppression?: boolean;
    nonStationaryNoiseSuppression?: boolean;
    echoEnabled?: boolean;
    stationaryNoiseSuppressionSr?: boolean;
    nonStationaryNoiseSuppressionSr?: boolean;
    ledMode: LedRingMode;
    ledBrightness: number;
    ledColor: string;
    vadLed: boolean;
}

/**
 * The sole API-document adapter for this page. It keeps components independent
 * of whether documents come from HTTP today or rosbridge in the future.
 * Missing DSP parameters remain undefined so the UI can report them honestly.
 */
export function adaptMicrophoneArrayDocument(
    document: MicrophoneArrayTelemetryDocument,
): MicrophoneArrayTelemetryViewModel;
export function adaptMicrophoneArrayDocument(
    document: MicrophoneArrayTuningDocument,
): MicrophoneArrayViewModel;
export function adaptMicrophoneArrayDocument(
    document: MicrophoneArrayTelemetryDocument | MicrophoneArrayTuningDocument,
): MicrophoneArrayTelemetryViewModel | MicrophoneArrayViewModel {
    if (!("parameters" in document)) {
        return {
            doaAngle: document.doa_angle,
            voiceActivity: document.voice_activity,
            speechDetected: document.speech_detected,
            audioLevels: document.audio_levels,
            simulation: document.simulation,
            error: document.error,
        };
    }

    const parameters = document.parameters;

    return {
        preset: document.preset,
        presets: document.presets,
        simulation: document.simulation,
        highPassFilter: parameters.HPFONOFF,
        agcEnabled:
            parameters.AGCONOFF === undefined
                ? undefined
                : parameters.AGCONOFF === 1,
        agcMaxGain: parameters.AGCMAXGAIN,
        agcDesiredLevel: parameters.AGCDESIREDLEVEL,
        agcTime: parameters.AGCTIME,
        stationaryNoiseSuppression:
            parameters.STATNOISEONOFF === undefined
                ? undefined
                : parameters.STATNOISEONOFF === 1,
        nonStationaryNoiseSuppression:
            parameters.NONSTATNOISEONOFF === undefined
                ? undefined
                : parameters.NONSTATNOISEONOFF === 1,
        echoEnabled:
            parameters.ECHOONOFF === undefined
                ? undefined
                : parameters.ECHOONOFF === 1,
        stationaryNoiseSuppressionSr:
            parameters.STATNOISEONOFF_SR === undefined
                ? undefined
                : parameters.STATNOISEONOFF_SR === 1,
        nonStationaryNoiseSuppressionSr:
            parameters.NONSTATNOISEONOFF_SR === undefined
                ? undefined
                : parameters.NONSTATNOISEONOFF_SR === 1,
        ledMode: document.led_ring.mode,
        ledBrightness: document.led_ring.brightness,
        ledColor: document.led_ring.color,
        vadLed: document.led_ring.vad_led === 1,
    };
}

@Injectable({
    providedIn: "root",
})
export class MicrophoneArrayService {
    constructor(private apiService: ApiService) {}

    getTelemetry(): Observable<MicrophoneArrayTelemetryViewModel> {
        return (
            this.apiService.get(
                `${UrlConstants.MICROPHONE_ARRAY}/telemetry`,
            ) as Observable<MicrophoneArrayTelemetryDocument>
        ).pipe(map((document) => adaptMicrophoneArrayDocument(document)));
    }

    getTuning(): Observable<MicrophoneArrayViewModel> {
        return (
            this.apiService.get(
                `${UrlConstants.MICROPHONE_ARRAY}/tuning`,
            ) as Observable<MicrophoneArrayTuningDocument>
        ).pipe(map((document) => adaptMicrophoneArrayDocument(document)));
    }

    updateTuning(
        update: MicrophoneArrayTuningUpdate,
    ): Observable<MicrophoneArrayViewModel> {
        return (
            this.apiService.post(
                `${UrlConstants.MICROPHONE_ARRAY}/tuning`,
                update,
            ) as Observable<MicrophoneArrayTuningDocument>
        ).pipe(map((document) => adaptMicrophoneArrayDocument(document)));
    }
}
