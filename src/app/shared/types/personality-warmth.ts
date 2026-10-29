/**
 * Cold/warm state of the open personality's Hermes agent (PR-2130).
 *
 * Cold means the running hermes-daemon holds no constructed agent for this
 * personality, so its first turn pays the whole local cold start - profile
 * provisioning, imports, tool registration, MCP discovery - before the first
 * token. Opening the personality warms it: the daemon builds the cached agent
 * and runs no model request, so the warm-up costs no tokens.
 *
 * ``unknown`` is not ``cold``: the daemon could not be asked, or the probe
 * failed, and a state nobody measured must not read as a fault. ``notSupported``
 * belongs to a direct-channel personality, which never uses a Hermes agent.
 */

export type PersonalityWarmthState =
    | "warm"
    | "cold"
    | "warming"
    | "notSupported"
    | "unknown";

export interface PersonalityWarmth {
    personalityId?: string | null;
    state: PersonalityWarmthState;
    warm: boolean;
    /** Machine reason of a cold or unknown outcome. */
    reason?: string | null;
    detail?: string | null;
    /** How long the last warm-up took, when the backend measured it. */
    elapsedMs?: number | null;
}

export const UNKNOWN_PERSONALITY_WARMTH: PersonalityWarmth = {
    state: "unknown",
    warm: false,
};

/** What the daemon can answer. ``warming`` only ever comes from the browser. */
const BACKEND_STATES: Record<string, PersonalityWarmthState> = {
    warm: "warm",
    cold: "cold",
    not_supported: "notSupported",
    notSupported: "notSupported",
    unknown: "unknown",
};

export const WARMTH_LABELS: Record<PersonalityWarmthState, string> = {
    warm: "warm",
    cold: "cold",
    warming: "warming…",
    notSupported: "direct · no warm-up",
    unknown: "not checked",
};

/** Reason codes the chip explains without echoing a backend sentence. */
export const WARMTH_REASON_LABELS: Record<string, string> = {
    no_provider_key: "no provider key stored",
    in_process_unavailable: "warm agent unavailable in this build",
    agent_unavailable: "Hermes agent could not be loaded",
    warm_failed: "warm-up failed",
    daemon_unreachable: "hermes-daemon unreachable",
    invalid_response: "hermes-daemon answered unexpectedly",
    direct_channel: "direct channel",
};

/**
 * Chip class for one state. Green means the next turn starts warm, the muted
 * class means it will pay the cold start, and neutral is used while the state
 * is being established or could not be read.
 */
export function warmthCssClass(state: PersonalityWarmthState): string {
    if (state === "warm") return "voice-status-chip-warm";
    if (state === "cold") return "voice-status-chip-cold";
    return "voice-status-chip-neutral";
}

export function warmthLabel(
    warmth: PersonalityWarmth | null | undefined,
): string {
    return WARMTH_LABELS[warmth?.state ?? "unknown"];
}

/** Read a raw API response into the shape the strip uses. */
export function parsePersonalityWarmth(raw: unknown): PersonalityWarmth {
    if (raw == null || typeof raw !== "object") {
        return {...UNKNOWN_PERSONALITY_WARMTH};
    }
    const source = raw as Record<string, unknown>;
    const rawState =
        typeof source["state"] === "string" ? (source["state"] as string) : "";
    const state = BACKEND_STATES[rawState];
    if (state == null) {
        return {...UNKNOWN_PERSONALITY_WARMTH};
    }
    return {
        personalityId: asString(source["personalityId"]),
        state,
        warm: source["warm"] === true,
        reason: asString(source["reason"]),
        detail: asString(source["detail"]),
        elapsedMs: asNumber(source["elapsedMs"]),
    };
}

/** The state while the browser's own warm-up is in flight. */
export function warmingPersonality(
    previous: PersonalityWarmth | null | undefined,
): PersonalityWarmth {
    return {
        personalityId: previous?.personalityId ?? null,
        state: "warming",
        warm: false,
    };
}

export function warmthReasonLabel(reason: string | null | undefined): string {
    if (!reason) return "";
    return WARMTH_REASON_LABELS[reason] ?? reason;
}

/**
 * One sentence for the chip's tooltip: what the state means for the next turn,
 * plus the reason and the measured warm-up duration when they exist.
 */
export function warmthTooltip(
    warmth: PersonalityWarmth | null | undefined,
): string {
    if (warmth == null || warmth.state === "unknown") {
        return "Warm state not checked: the Hermes daemon did not answer.";
    }
    if (warmth.state === "notSupported") {
        return "This personality runs on the direct channel and uses no Hermes agent.";
    }
    if (warmth.state === "warming") {
        return "Building the Hermes agent for this personality. No tokens are used.";
    }
    if (warmth.state === "warm") {
        const elapsed = warmth.elapsedMs;
        return elapsed != null
            ? `The next turn starts warm. The agent was built in ${Math.round(
                  elapsed,
              )} ms.`
            : "The next turn starts warm.";
    }
    const reason = warmthReasonLabel(warmth.reason);
    const head = "The next turn pays the cold start of the Hermes agent";
    const tail = reason ? ` (${reason}).` : ".";
    const detail = warmth.detail?.trim();
    return detail ? `${head}${tail} ${detail}` : `${head}${tail}`;
}

function asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() !== "" ? value : null;
}

function asNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
