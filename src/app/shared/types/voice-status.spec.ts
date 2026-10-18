import {
    EMPTY_VOICE_STATUS,
    parseTurnTrace,
    phaseForStage,
    sourceLabel,
    stageLabel,
    toVoiceStatus,
    type VoiceTurnTraceEvent,
} from "./voice-status";

function event(partial: Partial<VoiceTurnTraceEvent>): VoiceTurnTraceEvent {
    return {
        stage: "request_sent",
        ts_ms: 1000,
        source: "",
        chat_id: "chat-1",
        detail: null,
        ...partial,
    };
}

describe("voice-status", () => {
    describe("parseTurnTrace", () => {
        it("parses a trace line from the robot", () => {
            const parsed = parseTurnTrace(
                JSON.stringify({
                    stage: "turn_path",
                    ts_ms: 812.5,
                    source: "pib-cloud",
                    chat_id: "chat-1",
                    detail: {model: "pib-cloud"},
                }),
            );

            expect(parsed).toEqual({
                stage: "turn_path",
                ts_ms: 812.5,
                source: "pib-cloud",
                chat_id: "chat-1",
                detail: {model: "pib-cloud"},
            } as VoiceTurnTraceEvent);
        });

        it("returns null for empty and malformed lines instead of throwing", () => {
            expect(parseTurnTrace("")).toBeNull();
            expect(parseTurnTrace("not json")).toBeNull();
            expect(parseTurnTrace(JSON.stringify({source: "x"}))).toBeNull();
        });

        it("keeps an event without detail", () => {
            const parsed = parseTurnTrace(
                JSON.stringify({
                    stage: "first_audio",
                    ts_ms: 5,
                    source: "audio_player",
                }),
            );
            expect(parsed?.stage).toBe("first_audio");
            expect(parsed?.detail).toBeNull();
            expect(parsed?.chat_id).toBe("");
        });
    });

    describe("stage mapping", () => {
        it("maps the stages of a turn to phases", () => {
            expect(phaseForStage("end_of_speech")).toBe("thinking");
            expect(phaseForStage("text_received")).toBe("thinking");
            expect(phaseForStage("turn_path")).toBe("thinking");
            expect(phaseForStage("request_sent")).toBe("answering");
            expect(phaseForStage("first_token")).toBe("answering");
            expect(phaseForStage("first_sentence_flushed")).toBe("answering");
            expect(phaseForStage("first_audio")).toBe("speaking");
            expect(phaseForStage("last_audio")).toBe("speaking");
            expect(phaseForStage("something_new")).toBe("idle");
        });

        it("labels the known stages and falls back to the raw name", () => {
            expect(stageLabel("first_token")).toBe("first token");
            expect(stageLabel("something_new")).toBe("something_new");
        });

        it("labels the transports the chat node announces", () => {
            expect(
                sourceLabel(event({stage: "turn_path", source: "pib-cloud"})),
            ).toBe("pib.Cloud");
            expect(
                sourceLabel(event({stage: "turn_path", source: "hermes"})),
            ).toBe("Hermes");
            expect(
                sourceLabel(event({stage: "turn_path", source: "local"})),
            ).toBe("On-device");
            expect(
                sourceLabel(
                    event({stage: "turn_path", source: "direct-tool-loop"}),
                ),
            ).toBe("Direct tool loop");
            expect(sourceLabel(event({stage: "request_sent"}))).toBe("");
            expect(sourceLabel(null)).toBe("");
        });
    });

    describe("toVoiceStatus", () => {
        it("is off and idle when the voice assistant is turned off", () => {
            const status = toVoiceStatus({
                turnedOn: false,
                chatId: "chat-1",
                listening: true,
                lastEvent: event({stage: "first_audio"}),
                turnStartMs: 0,
            });

            expect(status.mic).toBe("off");
            expect(status.phase).toBe("speaking");
        });

        it("shows listening only while the recorder reads, otherwise ready", () => {
            const base = {
                turnedOn: true,
                chatId: "chat-1",
                lastEvent: null,
                turnStartMs: null,
            };
            expect(toVoiceStatus({...base, listening: true}).mic).toBe(
                "listening",
            );
            expect(toVoiceStatus({...base, listening: false}).mic).toBe(
                "ready",
            );
        });

        it("keeps the transport of the last answer and measures the stage against the turn start", () => {
            const status = toVoiceStatus({
                turnedOn: true,
                chatId: "chat-1",
                listening: false,
                lastEvent: event({stage: "first_audio", ts_ms: 2110.4}),
                turnStartMs: 1000,
                lastAnswer: event({
                    stage: "turn_path",
                    source: "pib-cloud",
                    detail: {model: "pib-cloud"},
                }),
            });

            expect(status.phase).toBe("speaking");
            expect(status.source).toBe("pib.Cloud");
            expect(status.model).toBe("pib-cloud");
            expect(status.lastStage).toBe("first audio");
            expect(status.lastStageElapsedMs).toBe(1110);
        });

        it("ignores events of another chat", () => {
            const status = toVoiceStatus({
                turnedOn: true,
                chatId: "chat-1",
                listening: false,
                lastEvent: event({stage: "first_audio", chat_id: "chat-2"}),
                turnStartMs: 1000,
            });

            expect(status.phase).toBe("idle");
            expect(status.lastStage).toBe("");
        });

        it("returns the empty status shape", () => {
            const status = toVoiceStatus({
                turnedOn: false,
                chatId: "",
                listening: false,
                lastEvent: null,
                turnStartMs: null,
            });
            expect(status).toEqual(EMPTY_VOICE_STATUS);
        });
    });
});
