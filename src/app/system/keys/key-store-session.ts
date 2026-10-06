/**
 * Named state of the operator key store for this Cerebra session.
 * Cancel enters degraded mode. It is not an error state.
 */
export const STARTING_MODE = "starting";
export const PROMPT_MODE = "prompt";
export const DEGRADED_MODE = "degraded";
export const UNLOCKED_MODE = "unlocked";

export type KeyStoreMode =
    | typeof STARTING_MODE
    | typeof PROMPT_MODE
    | typeof DEGRADED_MODE
    | typeof UNLOCKED_MODE;

export function chatsAvailable(mode: KeyStoreMode): boolean {
    return mode === UNLOCKED_MODE;
}

/**
 * The start-up dialog reads only the session mode, and a session starts in
 * STARTING_MODE so that nothing is asked before the backend has answered: a
 * cleartext robot never shows the dialog, and a locked encrypted store shows it
 * as soon as the status says so. A locked store does not dismiss a prompt that
 * Cerebra is already showing.
 */
export function modeAfterStatus(
    current: KeyStoreMode,
    status: {encryptKeyStorage?: boolean; mode?: string},
): KeyStoreMode {
    if (status.encryptKeyStorage === false || status.mode === "cleartext") {
        return UNLOCKED_MODE;
    }
    if (status.mode === UNLOCKED_MODE || status.mode === PROMPT_MODE) {
        return status.mode;
    }
    if (status.mode === DEGRADED_MODE) {
        // Locked with encryption on. From STARTING the prompt is due now; a prompt
        // already on screen stays, and a cancelled session (degraded) does not
        // bring it back.
        return current === PROMPT_MODE || current === STARTING_MODE
            ? PROMPT_MODE
            : DEGRADED_MODE;
    }
    return current;
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
