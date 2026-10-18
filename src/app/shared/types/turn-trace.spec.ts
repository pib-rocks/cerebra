import {
    DELTA_SPECS,
    TURN_STAGES,
    emptyTurnTrace,
    hasTrace,
    reduceTurnTrace,
    stageRows,
    traceDeltas,
    type TurnTrace,
} from "./turn-trace";
import {type VoiceTurnTraceEvent} from "./voice-status";

function event(partial: Partial<VoiceTurnTraceEvent>): VoiceTurnTraceEvent {
    return {
        stage: "request_sent",
        ts_ms: 0,
        source: "",
        chat_id: "chat-1",
        detail: null,
        ...partial,
    };
}

function fold(events: VoiceTurnTraceEvent[], chatId = "chat-1"): TurnTrace {
    return events.reduce(
        (state, next) => reduceTurnTrace(state, next),
        emptyTurnTrace(chatId),
    );
}

describe("turn-trace", () => {
    it("starts empty", () => {
        const state = emptyTurnTrace("chat-1");
        expect(hasTrace(state)).toBe(false);
        expect(stageRows(state)).toEqual([]);
        expect(traceDeltas(state)).toEqual([]);
    });

    it("keeps the eight stages in the robot's order and drops the duplicates", () => {
        const state = fold([
            event({stage: "end_of_speech", ts_ms: 1000}),
            event({stage: "request_sent", ts_ms: 1084.4}),
            event({stage: "response_headers", ts_ms: 1413}),
            event({stage: "first_token", ts_ms: 1416}),
            event({stage: "first_sentence_flushed", ts_ms: 1417.3}),
            event({stage: "first_audio", ts_ms: 2119}),
            // The first burst ends, another clause follows: last_audio wins.
            event({stage: "last_audio", ts_ms: 8000}),
            event({stage: "last_audio", ts_ms: 13595.4}),
            event({stage: "turn_end", ts_ms: 13600}),
        ]);

        expect(Object.keys(state.stages).length).toBe(8);
        expect(stageRows(state).map((row) => row.stage)).toEqual([
            ...TURN_STAGES,
        ]);
        expect(stageRows(state).map((row) => row.ms)).toEqual([
            0, 84.4, 413, 416, 417.3, 1119, 12595.4, 12600,
        ]);
        expect(state.startedMs).toBe(1000);
    });

    it("computes the same named deltas the robot prints", () => {
        const state = fold([
            event({stage: "end_of_speech", ts_ms: 1000}),
            event({stage: "text_received", ts_ms: 1723.5}),
            event({stage: "request_sent", ts_ms: 1808}),
            event({stage: "response_headers", ts_ms: 2136.6}),
            event({stage: "first_token", ts_ms: 2139.9}),
            event({stage: "first_sentence_flushed", ts_ms: 2141.2}),
            event({stage: "first_audio", ts_ms: 7260.1}),
            event({stage: "last_audio", ts_ms: 19855.5}),
        ]);

        const deltas = Object.fromEntries(
            traceDeltas(state).map((delta) => [
                delta.name,
                Math.round(delta.ms),
            ]),
        );

        expect(Object.keys(deltas)).toEqual(
            DELTA_SPECS.map(([name]) => name).filter((name) => name in deltas),
        );
        expect(deltas["eos_to_text"]).toBe(724);
        expect(deltas["text_to_req"]).toBe(85);
        expect(deltas["req_to_headers"]).toBe(329);
        expect(deltas["headers_to_first_token"]).toBe(3);
        expect(deltas["first_token_to_sentence"]).toBe(1);
        expect(deltas["sentence_to_first_audio"]).toBe(5119);
        expect(deltas["audio"]).toBe(12595);
    });

    it("opens a new turn on end_of_speech and forgets the previous stages", () => {
        const first = fold([
            event({stage: "end_of_speech", ts_ms: 1000}),
            event({stage: "first_token", ts_ms: 1500}),
        ]);
        expect(Object.keys(first.stages)).toEqual([
            "end_of_speech",
            "first_token",
        ]);

        const second = reduceTurnTrace(
            first,
            event({stage: "end_of_speech", ts_ms: 9000}),
        );
        expect(second.startedMs).toBe(9000);
        expect(second.stages).toEqual({end_of_speech: 0});
        expect(second.streamEnd).toBe("");

        const next = reduceTurnTrace(
            second,
            event({stage: "request_sent", ts_ms: 9100}),
        );
        expect(next.stages).toEqual({end_of_speech: 0, request_sent: 100});
    });

    it("anchors a turn without end_of_speech at its first event", () => {
        const state = fold([
            event({
                stage: "turn_path",
                ts_ms: 5000,
                source: "pib-cloud",
                detail: {model: "pib-cloud"},
            }),
            event({stage: "first_token", ts_ms: 5300}),
        ]);

        expect(state.startedMs).toBe(5000);
        expect(state.stages["first_token"]).toBe(300);
        expect(state.source).toBe("pib-cloud");
        expect(state.model).toBe("pib-cloud");
    });

    it("records the transport and the stream end", () => {
        const state = fold([
            event({stage: "end_of_speech", ts_ms: 0}),
            event({
                stage: "turn_path",
                ts_ms: 10,
                source: "hermes",
                detail: {model: "gemini-3.8-flash"},
            }),
            event({stage: "stream_done", ts_ms: 2000}),
        ]);

        expect(state.source).toBe("hermes");
        expect(state.model).toBe("gemini-3.8-flash");
        expect(state.streamEnd).toBe("done");
        expect(hasTrace(state)).toBe(true);
    });

    it("ignores events of another chat and null events", () => {
        const state = fold([event({stage: "end_of_speech", ts_ms: 1000})]);
        const foreign = reduceTurnTrace(
            state,
            event({stage: "first_token", ts_ms: 1500, chat_id: "chat-2"}),
        );
        expect(foreign).toBe(state);
        expect(reduceTurnTrace(state, null)).toBe(state);
    });

    it("shows an unknown stage after the known ones instead of dropping it", () => {
        const state = fold([
            event({stage: "end_of_speech", ts_ms: 0}),
            event({stage: "some_new_stage", ts_ms: 250}),
        ]);
        const rows = stageRows(state);
        expect(rows[rows.length - 1]).toEqual({
            stage: "some_new_stage",
            label: "some_new_stage",
            ms: 250,
        });
    });
});
