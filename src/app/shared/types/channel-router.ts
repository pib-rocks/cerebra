/**
 * Per-personality chat channel. Smart (Hermes) is the default. Direct is an
 * explicit opt-in and is a separate control from the provider.
 */
export const SMART_CHANNEL = "smart";
export const DIRECT_CHANNEL = "direct";

export type ChatChannel = typeof SMART_CHANNEL | typeof DIRECT_CHANNEL;

export const DEFAULT_CHAT_CHANNEL: ChatChannel = SMART_CHANNEL;

export function parseChatChannel(
    value: string | null | undefined,
): ChatChannel {
    return value === DIRECT_CHANNEL ? DIRECT_CHANNEL : SMART_CHANNEL;
}

/**
 * With the Hermes channel disabled at install time, Direct is the only path.
 * The stored value is left as-is so turning the capability back on restores it.
 */
export function effectiveChannel(
    stored: string | null | undefined,
    smartChatsEnabled: boolean,
): ChatChannel {
    if (!smartChatsEnabled) {
        return DIRECT_CHANNEL;
    }
    return parseChatChannel(stored);
}

export function showSmartChannelControl(smartChatsEnabled: boolean): boolean {
    return smartChatsEnabled;
}

/** The one editable identity. Channel changes do not replace this text. */
export function identityText(description: string | null | undefined): string {
    return description ?? "";
}

export interface RoutedTurn {
    channel: ChatChannel;
    content: string;
    /** Direct: the identity text, sent as the system prompt. Smart: Hermes loads SOUL.md. */
    systemPrompt: string | null;
    /** Hermes MEMORY.md. Never attached on a Direct turn. */
    memory: string | null;
}

export function routeTurn(input: {
    channel: string | null | undefined;
    smartChatsEnabled: boolean;
    soul: string | null | undefined;
    memory: string | null | undefined;
    content: string;
}): RoutedTurn {
    const channel = effectiveChannel(input.channel, input.smartChatsEnabled);
    if (channel === DIRECT_CHANNEL) {
        return {
            channel,
            content: input.content,
            systemPrompt: identityText(input.soul),
            memory: null,
        };
    }
    return {
        channel,
        content: input.content,
        systemPrompt: null,
        memory: input.memory ?? null,
    };
}

/**
 * Both channels use the ROS send_chat_message request. The system prompt is
 * the personality identity, not a second message in the chat store.
 */
export function transportRequest(
    chatId: string,
    turn: RoutedTurn,
): {chat_id: string; content: string} {
    return {
        chat_id: chatId,
        content: turn.content,
    };
}
