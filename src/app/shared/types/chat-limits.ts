/** Matches ChatMessage.content column length in the backend (db.String(100000)). */
export const CHAT_MESSAGE_MAX_LENGTH = 100_000;

/**
 * Refusal when a submitted line exceeds the stored message size. Null when the
 * text is within the limit.
 */
export function chatMessageLengthRefusal(text: string): string | null {
    const length = text.length;
    if (length <= CHAT_MESSAGE_MAX_LENGTH) {
        return null;
    }
    return (
        `This message is too long (${length} characters; the limit is ` +
        `${CHAT_MESSAGE_MAX_LENGTH}). Shorten it or attach the document instead.`
    );
}
