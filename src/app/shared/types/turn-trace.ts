/**
 * Turn trace of one chat (PC-83).
 *
 * Mirrors `turn_latency.py` on the robot: the same eight stages, the same extras,
 * the same "last value wins" rule for `last_audio` and the same named deltas - so
 * the panel and the container's `TURN_LATENCY` line can be compared number by
 * number.
 *
 * Pure functions only: the component renders, the chat component folds events in.
 */
import {VoiceTurnTraceEvent} from "./voice-status";

/** The eight stages the acceptance check requires on every turn line. */
export const TURN_STAGES = [
    "end_of_speech",
    "request_sent",
    "response_headers",
    "first_token",
    "first_sentence_flushed",
    "first_audio",
    "last_audio",
    "turn_end",
] as const;

/** Recorded when they happen, but not part of the eight. */
export const TURN_EXTRA_STAGES = ["text_received", "stream_done"] as const;

/** Later stage - earlier stage, in the order the robot prints them. */
export const DELTA_SPECS: ReadonlyArray<readonly [string, string, string]> = [
    ["eos_to_text", "end_of_speech", "text_received"],
    ["text_to_req", "text_received", "request_sent"],
    ["req_to_headers", "request_sent", "response_headers"],
    ["headers_to_first_token", "response_headers", "first_token"],
    ["first_token_to_sentence", "first_token", "first_sentence_flushed"],
    ["sentence_to_first_audio", "first_sentence_flushed", "first_audio"],
    ["audio", "first_audio", "last_audio"],
    ["eos_to_turn_end", "end_of_speech", "turn_end"],
];

/** A turn's playback runs in bursts, so the last burst decides `last_audio`. */
const LAST_WINS_STAGES = new Set(["last_audio"]);

const STAGE_LABELS: Record<string, string> = {
    end_of_speech: "end of speech",
    text_received: "text received",
    turn_path: "transport",
    request_sent: "request sent",
    response_headers: "response headers",
    first_token: "first token",
    first_sentence_flushed: "first sentence",
    first_audio: "first audio",
    last_audio: "last audio",
    turn_end: "turn end",
    stream_done: "stream done",
};

export interface TurnTrace {
    /** Chat this trace belongs to; events of another chat are ignored. */
    chatId: string;
    /** Trace timestamp of the turn start, null while no turn is known. */
    startedMs: number | null;
    /** Stage -> milliseconds since the turn start. */
    stages: Record<string, number>;
    /** Transport token announced by the chat node. */
    source: string;
    model: string;
    /** done once the stream reported its end. */
    streamEnd: string;
}

export function emptyTurnTrace(chatId = ""): TurnTrace {
    return {
        chatId,
        startedMs: null,
        stages: {},
        source: "",
        model: "",
        streamEnd: "",
    };
}

export function stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage;
}

/**
 * Fold one trace event into the trace of this chat.
 *
 * `end_of_speech` opens a new turn and forgets the previous stages. A turn that
 * starts without one (typed text) is anchored at its first event, so the numbers
 * stay relative and comparable.
 */
export function reduceTurnTrace(
    state: TurnTrace,
    event: VoiceTurnTraceEvent | null,
): TurnTrace {
    if (!event) {
        return state;
    }
    const chatId = state.chatId || event.chat_id;
    if (event.chat_id && state.chatId && event.chat_id !== state.chatId) {
        return state;
    }

    if (event.stage === "end_of_speech") {
        return {
            chatId,
            startedMs: event.ts_ms,
            // The anchor is a stage of its own at 0 ms: the eight-stage count and
            // the eos_to_* deltas need it.
            stages: {end_of_speech: 0},
            source: state.source,
            model: state.model,
            streamEnd: "",
        };
    }

    const startedMs = state.startedMs ?? event.ts_ms;
    const stages = {...state.stages};
    const ms = Math.round(Math.max(0, event.ts_ms - startedMs) * 10) / 10;
    if (!(event.stage in stages) || LAST_WINS_STAGES.has(event.stage)) {
        stages[event.stage] = ms;
    }

    const model = event.detail?.["model"];

    return {
        chatId,
        startedMs,
        stages,
        source: event.stage === "turn_path" ? event.source : state.source,
        model:
            event.stage === "turn_path" && typeof model === "string"
                ? model
                : state.model,
        streamEnd: event.stage === "stream_done" ? "done" : state.streamEnd,
    };
}

/** Stages that arrived, in the order the robot lists them. */
export function stageRows(
    state: TurnTrace,
): {stage: string; label: string; ms: number}[] {
    const order = [...TURN_STAGES, ...TURN_EXTRA_STAGES] as string[];
    const known = order.filter(
        (stage) => typeof state.stages[stage] === "number",
    );
    const unknown = Object.keys(state.stages).filter(
        (stage) => !order.includes(stage) && stage !== "turn_path",
    );
    return [...known, ...unknown].map((stage) => ({
        stage,
        label: stageLabel(stage),
        ms: state.stages[stage],
    }));
}

/** The named gaps, only where both ends are present. */
export function traceDeltas(state: TurnTrace): {name: string; ms: number}[] {
    const deltas: {name: string; ms: number}[] = [];
    for (const [name, earlier, later] of DELTA_SPECS) {
        const from = state.stages[earlier];
        const to = state.stages[later];
        if (typeof from === "number" && typeof to === "number") {
            deltas.push({name, ms: to - from});
        }
    }
    return deltas;
}

export function hasTrace(state: TurnTrace): boolean {
    return Object.keys(state.stages).length > 0 || Boolean(state.source);
}
