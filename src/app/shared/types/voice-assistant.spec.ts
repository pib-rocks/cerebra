import {DIRECT_CHANNEL, SMART_CHANNEL} from "./channel-router";
import {DEFAULT_PROVIDER_REF} from "./provider-registry";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
} from "./personality-dialog";
import {
    VOICE_MODE_LIVE,
    VoiceAssistant,
    parseDtoToVoiceAssistant,
    personalityWriteBody,
} from "./voice-assistant";

/** Columns the dialog collects. memory and thinkingFiller are not among them. */
const PERSONALITY_WRITE_KEYS = [
    "channel",
    "description",
    "gender",
    "liveIdleTimeout",
    "messageHistory",
    "name",
    "pauseThreshold",
    "providerRef",
    "sttEngine",
    "toolCalling",
    "ttsEngine",
];

describe("personality write body", () => {
    it("sends exactly the columns the dialog collects", () => {
        const persona = new VoiceAssistant(
            "",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            7,
            10,
            "7",
            SMART_CHANNEL,
            {
                voiceInput: "6",
                voiceOutput: LOCAL_VOICE_OUTPUT,
                toolCalling: false,
                images: true,
                live: true,
                idleTimeoutSeconds: 45,
                mcp: false,
            },
        );

        const created = personalityWriteBody(persona, true);

        expect(Object.keys(created).sort()).toEqual(PERSONALITY_WRITE_KEYS);
        expect(created.channel).toBe(SMART_CHANNEL);
        expect(created.providerRef).toBe("7");
        expect("voiceMode" in created).toBeFalse();
        expect(created.sttEngine).toBe("6");
        expect(created.ttsEngine).toBe(LOCAL_VOICE_OUTPUT);
        expect(created.liveIdleTimeout).toBe(45);
        expect(created.toolCalling).toBeFalse();
        expect(created.description).toBe("Du bist pib.");
    });

    it("keeps channel and providerRef, and reads a derived voice mode without sending one", () => {
        const persona = new VoiceAssistant(
            "",
            "Ada",
            "Female",
            0.8,
            "Du bist pib.",
            7,
            10,
            "7",
            DIRECT_CHANNEL,
            {
                voiceInput: LOCAL_VOICE_INPUT,
                voiceOutput: LOCAL_VOICE_OUTPUT,
                toolCalling: true,
                images: true,
                live: true,
                idleTimeoutSeconds: 45,
                mcp: false,
            },
        );
        const created = personalityWriteBody(persona, true);
        const saved = parseDtoToVoiceAssistant({
            personalityId: "persona-1",
            ...created,
            voiceMode: VOICE_MODE_LIVE,
        });
        const carried = personalityWriteBody(saved, true);

        expect(saved.channel).toBe(DIRECT_CHANNEL);
        expect(saved.providerRef).toBe("7");
        expect(saved.live).toBeTrue();
        expect("voiceMode" in created).toBeFalse();
        expect("voiceMode" in carried).toBeFalse();
        expect(carried).toEqual(created);
    });

    it("uses the same columns when the personality is updated", () => {
        const persona = new VoiceAssistant(
            "persona-1",
            "Ada",
            "Female",
            0.8,
            "",
        );
        const created = personalityWriteBody(persona, true);

        expect("voiceMode" in created).toBeFalse();
        expect(created.providerRef).toBe(DEFAULT_PROVIDER_REF);
        expect(created.sttEngine).toBe(LOCAL_VOICE_INPUT);
        expect(created.ttsEngine).toBe(LOCAL_VOICE_OUTPUT);
        expect(created.liveIdleTimeout).toBe(DEFAULT_IDLE_TIMEOUT_SECONDS);
        expect(created.channel).toBe(SMART_CHANNEL);

        persona.name = "Ada renamed";
        const updated = personalityWriteBody(persona, true);

        expect(Object.keys(updated).sort()).toEqual(
            Object.keys(created).sort(),
        );
        expect(updated.channel).toBe(created.channel);
        expect(updated.providerRef).toBe(created.providerRef);
        expect("voiceMode" in updated).toBeFalse();
        expect(updated.name).toBe("Ada renamed");
    });
});
