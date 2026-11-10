/**
 * Voice turn telemetry as the chat can understand it.
 *
 * The voice runtime publishes one JSON object per event on `/voice_turn_trace`
 * (see turn_latency.py on the robot side): `{stage, ts_ms, source, chat_id, detail}`.
 * The chat node adds a `turn_path` event carrying the transport it selected, so the
 * UI can name the model that answered and notice a local fallback.
 *
 * Everything here is pure: no RxJS, no component state, so the mapping is tested
 * without a browser.
 */

export type VoicePhase = "idle" | "thinking" | "answering" | "speaking";
export type MicState = "off" | "ready" | "listening";

export interface VoiceTurnTraceEvent {
    stage: string;
    ts_ms: number;
    source: string;
    chat_id: string;
    detail?: Record<string, unknown> | null;
}

export interface VoiceStatus {
    /** Microphone side: voice turned off, ready, or actively reading. */
    mic: MicState;
    /** What the running turn is doing, derived from the last trace stage. */
    phase: VoicePhase;
    /** Transport label of the last answer, empty while unknown. */
    source: string;
    /** Model api name of the last answer, empty while unknown. */
    model: string;
    /** Label of the last trace stage, empty when no event arrived yet. */
    lastStage: string;
    /** Milliseconds since the turn started, null without a turn start. */
    lastStageElapsedMs: number | null;
    /** User-visible pib.Cloud live session fault, null when healthy. */
    sessionError: string | null;
}

export function initialVoiceStatus(): VoiceStatus {
    return {
        mic: "off",
        phase: "idle",
        source: "",
        model: "",
        lastStage: "",
        lastStageElapsedMs: null,
        sessionError: null,
    };
}

export const EMPTY_VOICE_STATUS: VoiceStatus = initialVoiceStatus();

const LIVE_SESSION_END_REASON_MESSAGES: Record<string, string> = {
    daily_live_quota_exhausted: "pib.Cloud daily live quota exhausted",
    mint_failed: "pib.Cloud session authentication failed",
    connection_failed: "pib.Cloud live connection failed",
};

/** Map a `live_session_ended` detail reason to text for the status strip. */
export function formatLiveSessionEndReason(reason: string): string {
    const key = reason.trim();
    if (!key) {
        return "";
    }
    const known = LIVE_SESSION_END_REASON_MESSAGES[key];
    if (known) {
        return known;
    }
    return `pib.Cloud live session ended: ${key}`;
}

const SESSION_ERROR_CLEAR_STAGES = new Set([
    "turn_started",
    "first_llm_Delta",
    "live_session_started",
]);

const SESSION_ERROR_BENIGN_END_REASONS = new Set([
    "closed",
    "stopped",
    "idle_timeout",
]);

export type VoiceStatusReduceEvent =
    | {kind: "trace"; trace: VoiceTurnTraceEvent}
    | {kind: "enabled"; enabled: boolean};

/** Fold trace and enablement into `sessionError` on an otherwise computed status. */
export function reduceVoiceStatus(
    status: VoiceStatus,
    event: VoiceStatusReduceEvent,
): VoiceStatus {
    if (event.kind === "enabled") {
        if (event.enabled) {
            return {...status, sessionError: null};
        }
        return status;
    }

    const t = event.trace;
    if (t.stage === "live_session_ended") {
        const reason =
            typeof t.detail?.["reason"] === "string"
                ? t.detail["reason"].trim()
                : "";
        if (reason && !SESSION_ERROR_BENIGN_END_REASONS.has(reason)) {
            return {
                ...status,
                sessionError: formatLiveSessionEndReason(reason),
            };
        }
        return status;
    }

    if (SESSION_ERROR_CLEAR_STAGES.has(t.stage)) {
        return {...status, sessionError: null};
    }

    return status;
}

/** Transport tokens the chat node publishes with `turn_path`. */
export const TURN_PATH_LABELS: Record<string, string> = {
    "pib-cloud": "pib.Cloud",
    hermes: "Hermes",
    local: "On-device",
    "direct-tool-loop": "Direct tool loop",
};

/** Stage names that have a human label; unknown stages show their raw name. */
export const STAGE_LABELS: Record<string, string> = {
    end_of_speech: "end of speech",
    text_received: "text received",
    turn_path: "transport",
    request_sent: "request sent",
    response_headers: "response headers",
    first_token: "first token",
    first_sentence_flushed: "first sentence",
    first_audio: "first audio",
    last_audio: "last audio",
    stream_done: "stream done",
};

export const PHASE_LABELS: Record<VoicePhase, string> = {
    idle: "Idle",
    thinking: "Thinking",
    answering: "Answering",
    speaking: "Speaking",
};

export const MIC_LABELS: Record<MicState, string> = {
    off: "Voice off",
    ready: "Ready",
    listening: "Listening",
};

/** Stages in the order a turn passes them; used for the phase mapping. */
const THINKING_STAGES = new Set([
    "end_of_speech",
    "text_received",
    "turn_path",
]);
const ANSWERING_STAGES = new Set([
    "request_sent",
    "response_headers",
    "first_token",
    "first_sentence_flushed",
]);
const SPEAKING_STAGES = new Set(["first_audio", "last_audio"]);

export function parseTurnTrace(raw: string): VoiceTurnTraceEvent | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<VoiceTurnTraceEvent>;
        if (!parsed || typeof parsed.stage !== "string") return null;
        return {
            stage: parsed.stage,
            ts_ms: typeof parsed.ts_ms === "number" ? parsed.ts_ms : 0,
            source: typeof parsed.source === "string" ? parsed.source : "",
            chat_id: typeof parsed.chat_id === "string" ? parsed.chat_id : "",
            detail:
                parsed.detail && typeof parsed.detail === "object"
                    ? (parsed.detail as Record<string, unknown>)
                    : null,
        };
    } catch {
        return null;
    }
}

export function phaseForStage(stage: string): VoicePhase {
    if (THINKING_STAGES.has(stage)) return "thinking";
    if (ANSWERING_STAGES.has(stage)) return "answering";
    if (SPEAKING_STAGES.has(stage)) return "speaking";
    return "idle";
}

export function stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage;
}

export function sourceLabel(event: VoiceTurnTraceEvent | null): string {
    if (!event || event.stage !== "turn_path") return "";
    return TURN_PATH_LABELS[event.source] ?? event.source;
}

export function modelFor(event: VoiceTurnTraceEvent | null): string {
    if (!event || event.stage !== "turn_path") return "";
    const model = event.detail?.["model"];
    return typeof model === "string" ? model : "";
}

export interface VoiceStatusInput {
    turnedOn: boolean;
    /** Chat the UI is showing; events of other chats are ignored. */
    chatId: string;
    /** True while the recorder reads this chat's microphone. */
    listening: boolean;
    /** Last trace event of this chat, null before the first one. */
    lastEvent: VoiceTurnTraceEvent | null;
    /** Trace timestamp of the turn start, null while no turn runs. */
    turnStartMs: number | null;
    /** Transport of the last completed answer, kept while the next turn starts. */
    lastAnswer?: VoiceTurnTraceEvent | null;
    /** Optional sticky session error from a live_session_ended trace event. */
    sessionError?: string | null;
}

/**
 * Map the raw signals to what the strip shows.
 *
 * `lastEvent` decides the phase; the source comes from the most recent
 * `turn_path` event, which may be one turn older than the running one (the
 * announcement happens before the first token, so usually it is the same turn).
 */
export function toVoiceStatus(input: VoiceStatusInput): VoiceStatus {
    const mic: MicState = !input.turnedOn
        ? "off"
        : input.listening
        ? "listening"
        : "ready";

    const event = input.lastEvent;
    const belongs = !event || !event.chat_id || event.chat_id === input.chatId;
    const lastEvent = belongs ? event : null;

    const transport =
        lastEvent && lastEvent.stage === "turn_path"
            ? lastEvent
            : input.lastAnswer ?? null;

    const elapsed =
        lastEvent && input.turnStartMs !== null
            ? Math.max(0, Math.round(lastEvent.ts_ms - input.turnStartMs))
            : null;

    let sessionError = input.sessionError ?? null;
    if (lastEvent) {
        sessionError = reduceVoiceStatus(
            {
                mic,
                phase: "idle",
                source: "",
                model: "",
                lastStage: "",
                lastStageElapsedMs: null,
                sessionError,
            },
            {kind: "trace", trace: lastEvent},
        ).sessionError;
    }

    return {
        mic,
        phase: lastEvent ? phaseForStage(lastEvent.stage) : "idle",
        source: sourceLabel(transport),
        model: modelFor(transport),
        lastStage: lastEvent ? stageLabel(lastEvent.stage) : "",
        lastStageElapsedMs: elapsed,
        sessionError,
    };
}
