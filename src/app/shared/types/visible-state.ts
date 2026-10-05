import {ProviderSelectionRow, resolveProvider} from "./provider-registry";

/**
 * Listening, thinking and speaking, plus the two conditions that share
 * the same status: degraded (key store) and fallback (live was asked for
 * and the provider cannot run it, so the turn-based path is in use).
 */
export const LISTENING = "listening";
export const THINKING = "thinking";
export const SPEAKING = "speaking";
export const IDLE = "idle";

export type ConversationActivity =
    | typeof LISTENING
    | typeof THINKING
    | typeof SPEAKING
    | typeof IDLE;

/** Face file the expression node already has. Listening and speaking do not. */
export const THINKING_EXPRESSION = "thinking";

export const DISPLAY_TEXT_LIMIT = 40;

export type VoiceLedMode = "listen" | "think" | "speak";

export interface VisibleConversationInput {
    voiceTurnedOn: boolean;
    /**
     * chat_is_listening for the chat that holds the voice.
     * Unknown chats are listening, matching get_is_listening.
     */
    listening: boolean;
    /**
     * An assistant line is on this chat. voice_assistant_state and
     * chat_is_listening have no speaking field; the chat line is the
     * speech activity the mouth follows.
     */
    assistantSpeaking: boolean;
    holderName: string | null;
    keyStoreDegraded: boolean;
    liveUnavailable: boolean;
}

export interface VisibleConversation {
    activity: ConversationActivity;
    activityLabel: string;
    holderLine: string;
    degraded: boolean;
    fallback: boolean;
    /** Published on /pib/expression. Null leaves the current face alone. */
    expression: string | null;
    /** Published on /pib/display_text. Empty means do not publish. */
    displayText: string;
    /** Existing LED ring mode. Null means the ring is not taken over. */
    ledMode: VoiceLedMode | null;
    mouthOpen: boolean;
}

export function visibleConversation(
    input: VisibleConversationInput,
): VisibleConversation {
    const activity = conversationActivity(input);
    const holderName = input.holderName?.trim()
        ? input.holderName.trim()
        : null;
    const degraded = input.keyStoreDegraded;
    const fallback = input.voiceTurnedOn && input.liveUnavailable;
    return {
        activity,
        activityLabel: activityLabel(activity),
        holderLine: holderLine(input.voiceTurnedOn, holderName),
        degraded,
        fallback,
        expression: activity === THINKING ? THINKING_EXPRESSION : null,
        displayText: displayText(activity, holderName, degraded, fallback),
        ledMode: ledMode(activity),
        mouthOpen: activity === SPEAKING,
    };
}

export function conversationActivity(
    input: Pick<
        VisibleConversationInput,
        "voiceTurnedOn" | "listening" | "assistantSpeaking"
    >,
): ConversationActivity {
    if (!input.voiceTurnedOn) {
        return IDLE;
    }
    if (input.assistantSpeaking) {
        return SPEAKING;
    }
    if (input.listening) {
        return LISTENING;
    }
    return THINKING;
}

export function voiceHolderName(
    chatId: string,
    chats: readonly {chatId: string; personalityId: string}[],
    personalities: readonly {personalityId: string; name: string}[],
): string | null {
    if (chatId === "") {
        return null;
    }
    const chat = chats.find((item) => item.chatId === chatId);
    if (chat == null) {
        return null;
    }
    const personality = personalities.find(
        (item) => item.personalityId === chat.personalityId,
    );
    const name = personality?.name?.trim() ?? "";
    return name === "" ? null : name;
}

/**
 * Live was selected and the resolved provider cannot run it.
 * The local turn-based path is the fallback. An unloaded registry
 * is not treated as a fallback.
 */
export function livePathUnavailable(
    personality: {live: boolean; providerRef: string} | null | undefined,
    models: readonly ProviderSelectionRow[],
): boolean {
    if (personality == null || personality.live !== true) {
        return false;
    }
    if (models.length === 0) {
        return false;
    }
    const model = resolveProvider(personality.providerRef, [...models]);
    if (model == null) {
        return true;
    }
    return model.capabilities?.live !== true;
}

function activityLabel(activity: ConversationActivity): string {
    switch (activity) {
        case LISTENING:
            return "Listening";
        case THINKING:
            return "Thinking";
        case SPEAKING:
            return "Speaking";
        default:
            return "";
    }
}

function holderLine(voiceTurnedOn: boolean, holderName: string | null): string {
    if (!voiceTurnedOn) {
        return "Nobody holds the voice";
    }
    if (holderName == null) {
        return "The voice channel is held";
    }
    return `${holderName} holds the voice`;
}

function ledMode(activity: ConversationActivity): VoiceLedMode | null {
    switch (activity) {
        case LISTENING:
            return "listen";
        case THINKING:
            return "think";
        case SPEAKING:
            return "speak";
        default:
            return null;
    }
}

function displayText(
    activity: ConversationActivity,
    holderName: string | null,
    degraded: boolean,
    fallback: boolean,
): string {
    const parts: string[] = [];
    const label = activityLabel(activity);
    if (label !== "") {
        parts.push(label);
    }
    if (holderName != null && activity !== IDLE) {
        parts.push(holderName);
    }
    if (degraded) {
        parts.push("Degraded");
    }
    if (fallback) {
        parts.push("Fallback");
    }
    const line = parts.join(" · ");
    if (line.length <= DISPLAY_TEXT_LIMIT) {
        return line;
    }
    return line.slice(0, DISPLAY_TEXT_LIMIT);
}
