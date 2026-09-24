import {Injectable} from "@angular/core";
import {
    combineLatest,
    forkJoin,
    map,
    Observable,
    switchMap,
    throwError,
} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {
    MicrophoneArrayRosbridgeService,
    RosbridgeConnectionState,
} from "./microphone-array-rosbridge.service";

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

export interface MicrophoneArrayHealthDocument {
    simulation: boolean;
    simulation_reason: string | null;
    device_access: boolean;
    owner: string;
    vendor_id: string;
    product_id: string;
    note: string;
}

export interface MicrophoneArrayTuningUpdate {
    preset?: MicrophoneArrayPreset;
    parameters?: Partial<MicrophoneArrayParametersDocument>;
    led_ring?: Partial<MicrophoneArrayLedRingDocument>;
}

export interface MicrophoneArrayTelemetryViewModel {
    doaAngle?: number;
    voiceActivity?: boolean;
    speechDetected?: boolean;
    audioLevels?: number[];
    connectionState: RosbridgeConnectionState;
}

export interface MicrophoneArrayViewModel {
    preset?: MicrophoneArrayPreset;
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
    ledMode?: LedRingMode;
    ledBrightness?: number;
    ledColor?: string;
    vadLed?: boolean;
}

export interface MicrophoneArrayHealthViewModel {
    simulation: boolean;
    simulationReason: string | null;
    deviceAccess: boolean;
    owner: string;
    vendorId: string;
    productId: string;
    note: string;
}

export function adaptMicrophoneArrayDocument(
    document: MicrophoneArrayHealthDocument,
): MicrophoneArrayHealthViewModel;
export function adaptMicrophoneArrayDocument(
    document: MicrophoneArrayHealthDocument,
): MicrophoneArrayHealthViewModel {
    return {
        simulation: document.simulation,
        simulationReason: document.simulation_reason,
        deviceAccess: document.device_access,
        owner: document.owner,
        vendorId: document.vendor_id,
        productId: document.product_id,
        note: document.note,
    };
}

@Injectable({
    providedIn: "root",
})
export class MicrophoneArrayService {
    // The launch file pins this node name.
    private static readonly NODE_NAME = "/doa_publisher";

    constructor(
        private apiService: ApiService,
        private rosbridge: MicrophoneArrayRosbridgeService,
    ) {}

    connect(): void {
        this.rosbridge.connect();
    }

    disconnect(): void {
        this.rosbridge.disconnect();
    }

    getTelemetry(): Observable<MicrophoneArrayTelemetryViewModel> {
        return combineLatest([
            this.rosbridge.connectionState$,
            this.rosbridge.audioLevels$,
            this.rosbridge.voiceActivity$,
            this.rosbridge.speechDetected$,
            this.rosbridge.doaAngle$,
        ]).pipe(
            map(
                ([
                    connectionState,
                    audioLevels,
                    voiceActivity,
                    speechDetected,
                    doaAngle,
                ]) => ({
                    connectionState,
                    audioLevels,
                    voiceActivity,
                    speechDetected,
                    doaAngle,
                }),
            ),
        );
    }

    getHealth(): Observable<MicrophoneArrayHealthViewModel> {
        return (
            this.apiService.get(
                UrlConstants.MICROPHONE_ARRAY_HEALTH,
            ) as Observable<MicrophoneArrayHealthDocument>
        ).pipe(map((document) => adaptMicrophoneArrayDocument(document)));
    }

    getTuning(): Observable<MicrophoneArrayViewModel> {
        return forkJoin({
            preset: this.getParameter<MicrophoneArrayPreset>("preset"),
            ledMode: this.getParameter<LedRingMode>("led_mode"),
            ledBrightness: this.getParameter<number>("led_brightness"),
            ledColor: this.getParameter<string>("led_color"),
            vadLed: this.getParameter<0 | 1>("vad_led"),
            agcEnabled: this.getParameter<0 | 1>("AGCONOFF"),
            agcMaxGain: this.getParameter<number>("AGCMAXGAIN"),
            agcDesiredLevel: this.getParameter<number>("AGCDESIREDLEVEL"),
            agcTime: this.getParameter<number>("AGCTIME"),
            highPassFilter: this.getParameter<HighPassFilterValue>("HPFONOFF"),
            echoEnabled: this.getParameter<0 | 1>("ECHOONOFF"),
            stationaryNoiseSuppression: this.getParameter<0 | 1>(
                "STATNOISEONOFF",
            ),
            stationaryNoiseSuppressionSr: this.getParameter<0 | 1>(
                "STATNOISEONOFF_SR",
            ),
            nonStationaryNoiseSuppression: this.getParameter<0 | 1>(
                "NONSTATNOISEONOFF",
            ),
            nonStationaryNoiseSuppressionSr: this.getParameter<0 | 1>(
                "NONSTATNOISEONOFF_SR",
            ),
        }).pipe(
            map((parameters) => ({
                ...parameters,
                vadLed: parameters.vadLed === 1,
                agcEnabled: parameters.agcEnabled === 1,
                echoEnabled: parameters.echoEnabled === 1,
                stationaryNoiseSuppression:
                    parameters.stationaryNoiseSuppression === 1,
                stationaryNoiseSuppressionSr:
                    parameters.stationaryNoiseSuppressionSr === 1,
                nonStationaryNoiseSuppression:
                    parameters.nonStationaryNoiseSuppression === 1,
                nonStationaryNoiseSuppressionSr:
                    parameters.nonStationaryNoiseSuppressionSr === 1,
            })),
        );
    }

    updateTuning(
        update: MicrophoneArrayTuningUpdate,
    ): Observable<MicrophoneArrayViewModel> {
        const entries = this.parameterEntries(update);
        if (entries.length !== 1) {
            return throwError(
                () =>
                    new Error(
                        "Exactly one microphone parameter must be written.",
                    ),
            );
        }
        const [name, value] = entries[0];
        return this.setParameter(name, value).pipe(
            switchMap(() => this.getTuning()),
        );
    }

    private getParameter<T>(name: string): Observable<T> {
        return this.rosbridge.getParameter<T>(
            `${MicrophoneArrayService.NODE_NAME}:${name}`,
        );
    }

    private setParameter(name: string, value: unknown): Observable<void> {
        return this.rosbridge.setParameter(
            `${MicrophoneArrayService.NODE_NAME}:${name}`,
            value,
        );
    }

    private parameterEntries(
        update: MicrophoneArrayTuningUpdate,
    ): [string, unknown][] {
        const entries: [string, unknown][] = [];
        if (update.preset !== undefined) {
            entries.push(["preset", update.preset]);
        }
        for (const [name, value] of Object.entries(update.parameters ?? {})) {
            if (value !== undefined) {
                entries.push([name, value]);
            }
        }
        const ledNames: Record<keyof MicrophoneArrayLedRingDocument, string> = {
            mode: "led_mode",
            brightness: "led_brightness",
            color: "led_color",
            vad_led: "vad_led",
        };
        for (const [name, value] of Object.entries(update.led_ring ?? {})) {
            if (value !== undefined) {
                entries.push([
                    ledNames[name as keyof MicrophoneArrayLedRingDocument],
                    value,
                ]);
            }
        }
        return entries;
    }
}
