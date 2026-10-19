/**
 * Facts about the turn that produced an answer (PC-82).
 *
 * Stored by the voice runtime in the `meta` column of the chat message, so the
 * chat can explain an answer long after the turn: which transport answered, how
 * long each stage took and whether a local fallback ran.
 */
export interface ChatMessageMeta {
    /** Transport token: pib-cloud, hermes, local, direct-tool-loop. */
    source?: string;
    /** Model api name that answered. */
    model?: string;
    /** Stage name -> milliseconds since the turn started (end of speech). */
    stagesMs?: Record<string, number>;
    /** Why a fallback answered, when the cloud or the agent was not usable. */
    fallbackReason?: string;
    /** done, when the stream ended normally. */
    streamEnd?: string;
    /** Tool calls of the turn, filled by PC-84. */
    toolCalls?: {
        name?: string;
        ok?: boolean;
        durationMs?: number;
        [key: string]: unknown;
    }[];
}

const SOURCE_LABELS: Record<string, string> = {
    "pib-cloud": "pib.Cloud",
    hermes: "Hermes",
    local: "On-device",
    "direct-tool-loop": "Direct tool loop",
};

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
    stream_done: "stream done",
};

export function hasMeta(meta?: ChatMessageMeta | null): boolean {
    if (!meta) {
        return false;
    }
    return Boolean(
        meta.source ||
            meta.model ||
            meta.fallbackReason ||
            (meta.stagesMs && Object.keys(meta.stagesMs).length) ||
            (meta.toolCalls && meta.toolCalls.length),
    );
}

/** Short, human readable lines: transport, the three first stages, a fallback. */
export function metaSummary(meta?: ChatMessageMeta | null): string[] {
    if (!hasMeta(meta)) {
        return [];
    }
    const lines: string[] = [];
    const transport = meta!.source
        ? SOURCE_LABELS[meta!.source] ?? meta!.source
        : "";
    const model = meta!.model ?? "";
    if (transport || model) {
        lines.push(
            model && model !== transport
                ? `${transport} · ${model}`
                : transport || model,
        );
    }

    const stages = meta!.stagesMs ?? {};
    const order = [
        "end_of_speech",
        "request_sent",
        "first_token",
        "first_sentence_flushed",
        "first_audio",
        "last_audio",
    ];
    for (const stage of order) {
        const value = stages[stage];
        if (typeof value === "number") {
            lines.push(
                `${STAGE_LABELS[stage] ?? stage} +${Math.round(value)} ms`,
            );
        }
    }

    if (meta!.fallbackReason) {
        lines.push(`fallback: ${meta!.fallbackReason}`);
    }
    for (const call of meta!.toolCalls ?? []) {
        const name = call?.name ?? "tool";
        const outcome = call?.ok === false ? "failed" : "ok";
        const duration =
            typeof call?.durationMs === "number"
                ? ` ${Math.round(call.durationMs)} ms`
                : "";
        lines.push(`tool ${name} ${outcome}${duration}`);
    }
    return lines;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** A collapsed detail block for deep-chat; empty when there is nothing to show. */
export function metaHtml(meta?: ChatMessageMeta | null): string {
    const lines = metaSummary(meta);
    if (!lines.length) {
        return "";
    }
    const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    return (
        '<details class="chat-message-meta" data-test="CHAT_MESSAGE_META">' +
        `<summary>turn details</summary><ul>${items}</ul></details>`
    );
}
