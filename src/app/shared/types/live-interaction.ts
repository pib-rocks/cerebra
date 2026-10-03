/**
 * A typed line for the open live chat joins that session.
 *
 * Playback stops, so the spoken turn stays interruptible, and the text is
 * sent in. The session stays open. A line for another chat stays on the
 * ordinary text path. Blank text is ignored.
 */
export interface TypedLiveJoin {
    join: boolean;
    interrupt: boolean;
    text: string | null;
    keepSession: boolean;
}

export function typedTextJoinsLive(input: {
    liveOpen: boolean;
    liveChatId: string | null | undefined;
    messageChatId: string | null | undefined;
    text: unknown;
}): TypedLiveJoin {
    const cleaned = typeof input.text === "string" ? input.text.trim() : "";
    const sameChat = Boolean(
        input.liveOpen &&
            input.liveChatId &&
            input.messageChatId === input.liveChatId,
    );
    if (sameChat && cleaned !== "") {
        return {
            join: true,
            interrupt: true,
            text: cleaned,
            keepSession: true,
        };
    }
    return {
        join: false,
        interrupt: false,
        text: null,
        keepSession: Boolean(input.liveOpen),
    };
}
