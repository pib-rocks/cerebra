import {
    isProviderConfigured,
    isRetired,
    ProviderSelectionRow,
} from "./provider-registry";

/** Local speech engines. They need no provider key. */
export const LOCAL_VOICE_INPUT = "faster-whisper";
export const LOCAL_VOICE_OUTPUT = "supertone";

/**
 * Initial idle timeout when Live is selected. The concept requires the
 * control and does not name a duration; 60 seconds is the dialog's starting
 * value and can be changed per personality.
 */
export const DEFAULT_IDLE_TIMEOUT_SECONDS = 60;

export const IMAGES_NEED_TOOL_CALLING =
    "Images stay off while tool calling is off. An image is fetched by a tool.";
export const IMAGES_NEED_MCP =
    "Images stay off while the MCP server is off. The image tool is an MCP tool.";
export const IMAGES_NEED_TOOL_CALLING_AND_MCP =
    "Images stay off while tool calling and the MCP server are off.";
export const LIVE_NO_CAPABILITY = "This provider has no live capability.";
export const TOOLS_NO_CAPABILITY = "This provider cannot call tools.";

export interface PersonalityDialogValues {
    voiceInput: string;
    voiceOutput: string;
    toolCalling: boolean;
    images: boolean;
    live: boolean;
    idleTimeoutSeconds: number;
    mcp: boolean;
}

export interface DialogBlock {
    disabled: boolean;
    reason: string | null;
}

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
    const voiceInput = source?.voiceInput?.trim();
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
        mcp: source?.mcp !== false,
    };
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

/** Images require tool calling and the MCP server. Either one off greys the switch. */
export function imageSwitchAvailability(
    toolCalling: boolean,
    mcp: boolean,
): DialogBlock {
    if (!toolCalling && !mcp) {
        return {disabled: true, reason: IMAGES_NEED_TOOL_CALLING_AND_MCP};
    }
    if (!toolCalling) {
        return {disabled: true, reason: IMAGES_NEED_TOOL_CALLING};
    }
    if (!mcp) {
        return {disabled: true, reason: IMAGES_NEED_MCP};
    }
    return OPEN;
}

export function liveSwitchAvailability(
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
): DialogBlock {
    if (!registryLoaded || model == null) {
        return OPEN;
    }
    if (model.capabilities?.live === true) {
        return OPEN;
    }
    return {disabled: true, reason: LIVE_NO_CAPABILITY};
}

export function enforcePersonalityDialog(
    values: PersonalityDialogValues,
    model: ProviderSelectionRow | null,
    registryLoaded: boolean,
): PersonalityDialogValues {
    const next = readPersonalityDialog(values);
    if (toolCallingAvailability(model, registryLoaded).disabled) {
        next.toolCalling = false;
    }
    if (imageSwitchAvailability(next.toolCalling, next.mcp).disabled) {
        next.images = false;
    }
    if (liveSwitchAvailability(model, registryLoaded).disabled) {
        next.live = false;
    }
    return next;
}

export function voiceInputOptions(
    models: SpeechProviderRow[],
    cloudTokenStored: boolean,
): VoiceBackendOption[] {
    return speechOptions(models, "stt", cloudTokenStored, {
        id: LOCAL_VOICE_INPUT,
        label: "faster-whisper (local)",
    });
}

export function voiceOutputOptions(
    models: SpeechProviderRow[],
    cloudTokenStored: boolean,
): VoiceBackendOption[] {
    return speechOptions(models, "tts", cloudTokenStored, {
        id: LOCAL_VOICE_OUTPUT,
        label: "Supertone (local)",
    });
}

function speechOptions(
    models: SpeechProviderRow[],
    capability: "stt" | "tts",
    cloudTokenStored: boolean,
    local: VoiceBackendOption,
): VoiceBackendOption[] {
    const cloud = models
        .filter(
            (model) =>
                !isRetired(model) &&
                model.capabilities?.[capability] === true &&
                isProviderConfigured(model, cloudTokenStored),
        )
        .map((model) => ({
            id: String(model.id),
            label: model.visualName,
        }));
    return [local, ...cloud];
}

function idleTimeoutOrDefault(value: number | null | undefined): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
        return DEFAULT_IDLE_TIMEOUT_SECONDS;
    }
    return value;
}
