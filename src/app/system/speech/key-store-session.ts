/**
 * Named state of the operator key store for this Cerebra session.
 * Cancel enters degraded mode. It is not an error state.
 */
export const PROMPT_MODE = "prompt";
export const DEGRADED_MODE = "degraded";
export const UNLOCKED_MODE = "unlocked";

export type KeyStoreMode =
    | typeof PROMPT_MODE
    | typeof DEGRADED_MODE
    | typeof UNLOCKED_MODE;

export function chatsAvailable(mode: KeyStoreMode): boolean {
    return mode === UNLOCKED_MODE;
}

/**
 * What the personality says when Smart and Direct chats cannot run.
 * The missing capability is the locked provider keys, not local voice.
 */
export function degradedChatReply(personalityName: string | undefined): string {
    const name = personalityName?.trim() ?? "";
    const introduction = name === "" ? "I" : `I'm ${name}. I`;
    return (
        `${introduction} can't use Smart chat or Direct chat. ` +
        "The key store is locked, so the provider keys are missing. " +
        "I can still listen with faster-whisper and speak with Supertone."
    );
}
