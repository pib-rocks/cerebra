import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {ChatChannel, parseChatChannel} from "./channel-router";
import {
    PersonalityDialogValues,
    readPersonalityDialog,
} from "./personality-dialog";
import {
    DEFAULT_PROVIDER_REF,
    providerRefFromSelection,
} from "./provider-registry";

export class VoiceAssistant implements SidebarElement {
    personalityId: string;
    name: string;
    description: string | undefined;
    gender: string;
    pauseThreshold: number;
    assistantModelId: number | null;
    messageHistory: number;
    /** Model id as text, or "default". The provider follows from that model. */
    providerRef: string;
    channel: ChatChannel;
    voiceInput: string;
    voiceOutput: string;
    toolCalling: boolean;
    images: boolean;
    live: boolean;
    idleTimeoutSeconds: number;
    mcp: boolean;
    /** Set by the API when the selected catalogue row is retired. */
    needsNewModel = false;

    constructor(
        personalityId: string,
        name: string,
        gender: string,
        pauseThreshold: number,
        description?: string,
        assistantModelId?: number | null,
        messageHistory?: number,
        providerRef?: string | null,
        channel?: string | null,
        dialog?: Partial<PersonalityDialogValues> | null,
    ) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description ?? "";
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
        this.assistantModelId =
            assistantModelId == null || assistantModelId < 1
                ? null
                : assistantModelId;
        this.messageHistory = messageHistory ?? 10;
        if (providerRef != null && providerRef !== "") {
            this.providerRef = providerRef;
        } else if (this.assistantModelId != null) {
            this.providerRef = String(this.assistantModelId);
        } else {
            this.providerRef = DEFAULT_PROVIDER_REF;
        }
        this.channel = parseChatChannel(channel);
        const settings = readPersonalityDialog(dialog);
        this.voiceInput = settings.voiceInput;
        this.voiceOutput = settings.voiceOutput;
        this.toolCalling = settings.toolCalling;
        this.images = settings.images;
        this.live = settings.live;
        this.idleTimeoutSeconds = settings.idleTimeoutSeconds;
        this.mcp = settings.mcp;
    }

    assignDialog(settings: PersonalityDialogValues): void {
        const next = readPersonalityDialog(settings);
        this.voiceInput = next.voiceInput;
        this.voiceOutput = next.voiceOutput;
        this.toolCalling = next.toolCalling;
        this.images = next.images;
        this.live = next.live;
        this.idleTimeoutSeconds = next.idleTimeoutSeconds;
        this.mcp = next.mcp;
    }
    getName(): string {
        return this.name;
    }
    getUUID(): string {
        return this.personalityId;
    }

    clone(): VoiceAssistant {
        const copy = new VoiceAssistant(
            String(this.personalityId),
            String(this.name),
            String(this.gender),
            Number(this.pauseThreshold),
            String(this.description),
            this.assistantModelId,
            Number(this.messageHistory),
            this.providerRef,
            this.channel,
            readPersonalityDialog(this),
        );
        copy.needsNewModel = this.needsNewModel;
        return copy;
    }
}

/** Stored voiceMode. The dialog's Live switch selects this or turn_based. */
export const VOICE_MODE_LIVE = "live";
export const VOICE_MODE_TURN_BASED = "turn_based";

/**
 * Columns the Add and Edit dialog writes. images and mcp stay on the form:
 * a personality has no column for either, and the MCP switch is a separate
 * control from toolCalling. memory and thinkingFiller are columns the
 * dialog does not collect, so an update leaves them as stored.
 */
export interface VoiceAssistantDto {
    name: string;
    description: string | null | undefined;
    gender: string;
    channel: ChatChannel;
    providerRef: string;
    sttEngine: string;
    ttsEngine: string;
    voiceMode: typeof VOICE_MODE_LIVE | typeof VOICE_MODE_TURN_BASED;
    liveIdleTimeout: number;
    toolCalling: boolean;
    messageHistory: number;
    pauseThreshold: number;
}

export interface StoredPersonalityDialog
    extends Partial<PersonalityDialogValues> {
    sttEngine?: string | null;
    ttsEngine?: string | null;
    voiceMode?: string | null;
    liveIdleTimeout?: number | null;
}

/**
 * Dialog values from a stored personality. The wire names are the columns;
 * the form still uses its own control names.
 */
export function personalityDialogFromRecord(
    source: StoredPersonalityDialog | null | undefined,
): PersonalityDialogValues {
    return readPersonalityDialog({
        voiceInput: firstText(source?.sttEngine, source?.voiceInput),
        voiceOutput: firstText(source?.ttsEngine, source?.voiceOutput),
        toolCalling: source?.toolCalling,
        images: source?.images,
        live: liveFromStored(source),
        idleTimeoutSeconds: idleFromStored(source),
        mcp: source?.mcp,
    });
}

export function parseVoiceAssistantToDto(
    voiceAssistant: VoiceAssistant,
): VoiceAssistantDto {
    const dialog = readPersonalityDialog(voiceAssistant);
    const choice = providerRefFromSelection(voiceAssistant.providerRef ?? "");
    return {
        name: voiceAssistant.name,
        description: voiceAssistant.description ?? "",
        gender: voiceAssistant.gender,
        channel: parseChatChannel(voiceAssistant.channel),
        providerRef: choice.providerRef,
        sttEngine: dialog.voiceInput,
        ttsEngine: dialog.voiceOutput,
        voiceMode: dialog.live ? VOICE_MODE_LIVE : VOICE_MODE_TURN_BASED,
        liveIdleTimeout: dialog.idleTimeoutSeconds,
        toolCalling: dialog.toolCalling,
        messageHistory: voiceAssistant.messageHistory ?? 10,
        pauseThreshold: voiceAssistant.pauseThreshold,
    };
}

/**
 * Body for create and update. With Hermes disabled the stored channel is
 * left off the request: sending Smart is rejected, and sending Direct would
 * rewrite the row, so turning the flag back on would not restore it.
 */
export function personalityWriteBody(
    voiceAssistant: VoiceAssistant,
    smartChatsEnabled: true,
): VoiceAssistantDto;
export function personalityWriteBody(
    voiceAssistant: VoiceAssistant,
    smartChatsEnabled: false,
): Omit<VoiceAssistantDto, "channel">;
export function personalityWriteBody(
    voiceAssistant: VoiceAssistant,
    smartChatsEnabled: boolean,
): VoiceAssistantDto | Omit<VoiceAssistantDto, "channel">;
export function personalityWriteBody(
    voiceAssistant: VoiceAssistant,
    smartChatsEnabled: boolean,
): VoiceAssistantDto | Omit<VoiceAssistantDto, "channel"> {
    const body = parseVoiceAssistantToDto(voiceAssistant);
    if (smartChatsEnabled) {
        return body;
    }
    const {channel, ...withoutChannel} = body;
    void channel;
    return withoutChannel;
}

export interface PersonalityRecord extends StoredPersonalityDialog {
    personalityId: string;
    name: string;
    gender: string;
    pauseThreshold: number;
    description?: string | null;
    assistantModelId?: number | null;
    messageHistory?: number;
    providerRef?: string | null;
    channel?: string | null;
    needsNewModel?: boolean;
}

export function parseDtoToVoiceAssistant(
    dummyVoiceAssistant: PersonalityRecord,
): VoiceAssistant {
    const parsed = new VoiceAssistant(
        dummyVoiceAssistant.personalityId,
        dummyVoiceAssistant.name,
        dummyVoiceAssistant.gender,
        dummyVoiceAssistant.pauseThreshold,
        dummyVoiceAssistant.description ?? "",
        dummyVoiceAssistant.assistantModelId,
        dummyVoiceAssistant.messageHistory,
        dummyVoiceAssistant.providerRef,
        // Stored channel, not effectiveChannel. The installer flag only
        // changes how the personality is shown and run.
        dummyVoiceAssistant.channel,
        personalityDialogFromRecord(dummyVoiceAssistant),
    );
    parsed.needsNewModel = dummyVoiceAssistant.needsNewModel === true;
    return parsed;
}

function firstText(
    wire: string | null | undefined,
    dialog: string | null | undefined,
): string | undefined {
    const primary = wire?.trim();
    if (primary) {
        return primary;
    }
    const secondary = dialog?.trim();
    return secondary ? secondary : undefined;
}

function liveFromStored(
    source: StoredPersonalityDialog | null | undefined,
): boolean {
    const mode = source?.voiceMode?.trim();
    if (mode) {
        return mode === VOICE_MODE_LIVE;
    }
    return source?.live === true;
}

function idleFromStored(
    source: StoredPersonalityDialog | null | undefined,
): number | undefined {
    if (typeof source?.liveIdleTimeout === "number") {
        return source.liveIdleTimeout;
    }
    return source?.idleTimeoutSeconds;
}
