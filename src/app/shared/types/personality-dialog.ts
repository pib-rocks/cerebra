import {
    CLOUD_TOKEN_API_NAME,
    isRetired,
    ProviderSelectionRow,
    TokenProbeState,
    chatModelsForPersonalityDialog,
    credentialState,
    usesCloudToken,
} from "./provider-registry";

/** Local speech engines. They need no provider key. */
export const LOCAL_VOICE_INPUT = "faster-whisper";
export const LOCAL_VOICE_INPUT_STORED = "local_whisper";
export const LOCAL_VOICE_OUTPUT = "supertone";

/** Backend canonical ids for pib.Cloud STT and TTS (PC-43 / PC-109). */
export const CLOUD_VOICE_INPUT_STORED = "cloud_whisper";
export const CLOUD_VOICE_OUTPUT_STORED = "cloud_tts";

/**
 * Initial idle timeout when Live is selected. The concept requires the
 * control and does not name a duration; 60 seconds is the dialog's starting
 * value and can be changed per personality.
 */
export const DEFAULT_IDLE_TIMEOUT_SECONDS = 60;

/**
 * Closed set the API accepts for reasoningEffort. "none" is a real level:
 * it turns reasoning off. It is not the stand-in for a missing column.
 */
export const REASONING_EFFORTS = [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
    "ultra",
] as const;

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

/**
 * Select value for a stored NULL. The Hermes profile keeps its own level.
 * This is deliberately not "none".
 */
export const REASONING_EFFORT_UNMANAGED = "";

export const REASONING_EFFORT_UNMANAGED_LABEL = "Unchanged";

/** A new personality starts here. An existing NULL stays unmanaged. */
export const NEW_PERSONALITY_REASONING_EFFORT: ReasoningEffort = "none";

const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string> = {
    none: "None",
    minimal: "Minimal",
    low: "Low",
    medium: "Medium",
    high: "High",
    xhigh: "Extra high",
    max: "Max",
    ultra: "Ultra",
};

export const TOOLS_NO_CAPABILITY = "This provider cannot call tools.";
export const REASONING_NO_CAPABILITY =
    "This provider cannot be given a reasoning level.";

export interface PersonalityDialogValues {
    voiceInput: string;
    voiceOutput: string;
    toolCalling: boolean;
    images: boolean;
    live: boolean;
    idleTimeoutSeconds: number;
    /**
     * null is unmanaged: the column is NULL and the profile's own level
     * stays in place. One of the eight levels is written only when the
     * operator chose it.
     */
    reasoningEffort: ReasoningEffort | null;
}

export interface DialogBlock {
    disabled: boolean;
    reason: string | null;
}

/** Default of the "Voice" dropdown: the gender the spoken answer is synthesised in. */
export const DEFAULT_VOICE_GENDER = "Female";

/**
 * The two voices the cloud speech endpoint can be asked for. The robot maps the gender to the
 * provider voice code (F3 for Female, M3 = Adam for Male), so the dialog only carries the
 * choice, not a provider id.
 */
export const VOICE_GENDER_OPTIONS: readonly VoiceBackendOption[] = [
    {id: "Female", label: "Female"},
    {id: "Male", label: "Male"},
];

export interface VoiceBackendOption {
    id: string;
    label: string;
}

export interface SpeechProviderRow extends ProviderSelectionRow {
    visualName: string;
}

const OPEN: DialogBlock = {disabled: false, reason: null};

export function readPersonalityDialog(
    source: Partial<PersonalityDialogValues> | null | undefined,
): PersonalityDialogValues {
    const rawVoiceInput = source?.voiceInput?.trim();
    const voiceInput =
        rawVoiceInput === LOCAL_VOICE_INPUT_STORED
            ? LOCAL_VOICE_INPUT
            : rawVoiceInput;
    const voiceOutput = source?.voiceOutput?.trim();
    return {
        voiceInput:
            voiceInput != null && voiceInput !== ""
                ? voiceInput
                : LOCAL_VOICE_INPUT,
        voiceOutput:
            voiceOutput != null && voiceOutput !== ""
                ? voiceOutput
                : LOCAL_VOICE_OUTPUT,
        toolCalling: source?.toolCalling !== false,
        images: source?.images === true,
        live: source?.live === true,
        idleTimeoutSeconds: idleTimeoutOrDefault(source?.idleTimeoutSeconds),
        reasoningEffort: reasoningEffortFromStored(source?.reasoningEffort),
    };
}

export function reasoningEffortLabel(level: ReasoningEffort): string {
    return REASONING_EFFORT_LABELS[level];
}

/**
 * A stored level, or null when the column is NULL. Blank and unknown
 * text stay null so they are never saved as "none".
 */
export function reasoningEffortFromStored(
    value: string | null | undefined,
): ReasoningEffort | null {
    if (
        typeof value === "string" &&
        (REASONING_EFFORTS as readonly string[]).includes(value)
    ) {
        return value as ReasoningEffort;
    }
    return null;
}

export function toolCallingAvailability(
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
): DialogBlock {
    if (!registryLoaded || model == null) {
        return OPEN;
    }
    if (model.capabilities?.tools === true) {
        return OPEN;
    }
    return {disabled: true, reason: TOOLS_NO_CAPABILITY};
}

/**
 * Reasoning is a capability of the chosen catalogue row. A missing flag is
 * not a refusal: the field arrives with a later backend, and only an
 * explicit false greys the control out.
 */
export function reasoningAvailability(
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
): DialogBlock {
    if (!registryLoaded || model == null) {
        return OPEN;
    }
    if (model.capabilities?.reasoning === false) {
        return {disabled: true, reason: REASONING_NO_CAPABILITY};
    }
    return OPEN;
}

/**
 * Live is the chosen model's own flag. Before the catalogue has loaded,
 * the stored value is the one the provider endpoint already derived.
 */
export function liveFromChosenModel(
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
    storedLive: boolean,
): boolean {
    if (!registryLoaded) {
        return storedLive;
    }
    return model?.capabilities?.live === true;
}

export function cloudSpeechOption(
    models: readonly SpeechProviderRow[] = [],
): VoiceBackendOption {
    const cloud = models.find(
        (model) => model.apiName === CLOUD_TOKEN_API_NAME,
    );
    if (cloud != null) {
        return {
            id: String(cloud.id),
            label: cloud.visualName || "pib.Cloud",
        };
    }
    return {
        id: CLOUD_TOKEN_API_NAME,
        label: "pib.Cloud",
    };
}

export function enforcePersonalityDialog(
    values: PersonalityDialogValues,
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
    models: readonly SpeechProviderRow[] = [],
): PersonalityDialogValues {
    const next = readPersonalityDialog(values);
    if (toolCallingAvailability(model, registryLoaded).disabled) {
        next.toolCalling = false;
    }
    // images is not a control any more. It is carried through unchanged so
    // a stored value survives an unrelated edit.
    next.live = liveFromChosenModel(model, registryLoaded, next.live);
    if (next.live && registryLoaded) {
        const cloud = cloudSpeechOption(models);
        next.voiceInput = cloud.id;
        next.voiceOutput = cloud.id;
    }
    return next;
}

export function voiceInputOptions(
    models: SpeechProviderRow[],
    cloudTokenStored: boolean,
    tokenProbe: TokenProbeState = "available",
): VoiceBackendOption[] {
    return speechOptions(
        models,
        "stt",
        cloudTokenStored,
        {
            id: LOCAL_VOICE_INPUT,
            label: "faster-whisper (local)",
        },
        tokenProbe,
    );
}

export function voiceOutputOptions(
    models: SpeechProviderRow[],
    cloudTokenStored: boolean,
    tokenProbe: TokenProbeState = "available",
): VoiceBackendOption[] {
    return speechOptions(
        models,
        "tts",
        cloudTokenStored,
        {
            id: LOCAL_VOICE_OUTPUT,
            label: "Supertone (local)",
        },
        tokenProbe,
    );
}

/**
 * pib.Cloud comes first, then the local engine, then the other providers.
 * A new personality starts on the first offered option; an existing one
 * keeps its stored value.
 */
function speechOptions(
    models: SpeechProviderRow[],
    capability: "stt" | "tts",
    cloudTokenStored: boolean,
    local: VoiceBackendOption,
    tokenProbe: TokenProbeState,
): VoiceBackendOption[] {
    const offered = models.filter(
        (model) =>
            !isRetired(model) &&
            model.capabilities?.[capability] === true &&
            credentialState(model, cloudTokenStored, models, tokenProbe) ===
                "present",
    );
    const toOption = (model: SpeechProviderRow): VoiceBackendOption => ({
        id: String(model.id),
        label: model.visualName,
    });
    const cloud = offered
        .filter((model) => usesCloudToken(model, models))
        .map(toOption);
    const providers = offered.filter((model) => !usesCloudToken(model, models));
    return [...cloud, local, ...providers.map(toOption)];
}

/** Collapses cloud live rows to the single Natural Chat entry for the model select. */
export function chatModelOptions<T extends SpeechProviderRow>(
    offered: T[],
    catalogue: readonly T[],
    cloudTokenStored: boolean,
    tokenProbe: TokenProbeState = "available",
): T[] {
    return chatModelsForPersonalityDialog(
        offered,
        catalogue,
        cloudTokenStored,
        tokenProbe,
    );
}

function idleTimeoutOrDefault(value: number | null | undefined): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
        return DEFAULT_IDLE_TIMEOUT_SECONDS;
    }
    return value;
}

/**
 * Keeps a stored STT/TTS choice while the token probe is unfinished. Only
 * reconciles to the local fallback once the probe is available and the row
 * is genuinely gone from the offered list.
 */
export function reconcileVoiceSelection(
    current: string,
    options: readonly VoiceBackendOption[],
    fallback: string,
    tokenProbe: TokenProbeState,
    models: readonly ProviderSelectionRow[] = [],
): string {
    const normalized = normalizeStoredVoiceSelection(current, models);
    if (options.some((option) => option.id === normalized)) {
        return normalized;
    }
    if (tokenProbe !== "available" || options.length === 0) {
        return normalized;
    }
    return fallback;
}

/**
 * Maps canonical backend engine ids ("local_whisper", "cloud_whisper",
 * "cloud_tts") onto the option values rendered by the dialog select
 * ("faster-whisper" or the pib.Cloud catalogue row id).
 */
export function normalizeStoredVoiceSelection(
    current: string,
    models: readonly ProviderSelectionRow[] = [],
): string {
    const trimmed = current.trim();
    if (trimmed === LOCAL_VOICE_INPUT_STORED) {
        return LOCAL_VOICE_INPUT;
    }
    if (
        trimmed === CLOUD_VOICE_INPUT_STORED ||
        trimmed === CLOUD_VOICE_OUTPUT_STORED
    ) {
        const cloud = models.find((row) => usesCloudToken(row, models));
        if (cloud != null) {
            return String(cloud.id);
        }
    }
    return trimmed;
}
