import {AssistantModel} from "./assistantModel";
import {capabilitiesFrom} from "./provider-registry";
import {VoiceAssistant} from "./voice-assistant";
import {
    DISPLAY_TEXT_LIMIT,
    IDLE,
    LISTENING,
    SPEAKING,
    THINKING,
    THINKING_EXPRESSION,
    livePathUnavailable,
    visibleConversation,
    voiceHolderName,
} from "./visible-state";

describe("visible conversation state", () => {
    const base = {
        voiceTurnedOn: true,
        listening: false,
        assistantSpeaking: false,
        holderName: "Ada",
        keyStoreDegraded: false,
        liveUnavailable: false,
    };

    it("shows listening, thinking and speaking from the voice and the microphone", () => {
        const listening = visibleConversation({
            ...base,
            listening: true,
        });
        expect(listening.activity).toBe(LISTENING);
        expect(listening.activityLabel).toBe("Listening");
        expect(listening.ledMode).toBe("listen");
        expect(listening.mouthOpen).toBeFalse();
        expect(listening.expression).toBeNull();

        const thinking = visibleConversation(base);
        expect(thinking.activity).toBe(THINKING);
        expect(thinking.activityLabel).toBe("Thinking");
        expect(thinking.ledMode).toBe("think");
        expect(thinking.expression).toBe(THINKING_EXPRESSION);

        const speaking = visibleConversation({
            ...base,
            assistantSpeaking: true,
        });
        expect(speaking.activity).toBe(SPEAKING);
        expect(speaking.activityLabel).toBe("Speaking");
        expect(speaking.ledMode).toBe("speak");
        expect(speaking.mouthOpen).toBeTrue();
        expect(speaking.holderLine).toBe("Ada holds the voice");
    });

    it("stays idle and leaves the LED alone when the voice is off", () => {
        const idle = visibleConversation({
            ...base,
            voiceTurnedOn: false,
            listening: true,
            assistantSpeaking: true,
        });
        expect(idle.activity).toBe(IDLE);
        expect(idle.ledMode).toBeNull();
        expect(idle.holderLine).toBe("Nobody holds the voice");
        expect(idle.expression).toBeNull();
        expect(idle.displayText).toBe("");
    });

    it("shows degraded and fallback in the same status text", () => {
        const both = visibleConversation({
            ...base,
            listening: true,
            keyStoreDegraded: true,
            liveUnavailable: true,
        });
        expect(both.degraded).toBeTrue();
        expect(both.fallback).toBeTrue();
        expect(both.activity).toBe(LISTENING);
        expect(both.displayText).toContain("Listening");
        expect(both.displayText).toContain("Degraded");
        expect(both.displayText).toContain("Fallback");
        expect(both.displayText.length).toBeLessThanOrEqual(DISPLAY_TEXT_LIMIT);
    });

    it("does not call the turn-based path a fallback while the voice is off", () => {
        const off = visibleConversation({
            ...base,
            voiceTurnedOn: false,
            liveUnavailable: true,
            keyStoreDegraded: true,
        });
        expect(off.fallback).toBeFalse();
        expect(off.degraded).toBeTrue();
        expect(off.displayText).toContain("Degraded");
    });

    it("names the personality that owns the chat", () => {
        expect(
            voiceHolderName(
                "chat-1",
                [{chatId: "chat-1", personalityId: "p-1"}],
                [{personalityId: "p-1", name: "Ada"}],
            ),
        ).toBe("Ada");
        expect(voiceHolderName("", [], [])).toBeNull();
        expect(
            voiceHolderName(
                "missing",
                [{chatId: "chat-1", personalityId: "p-1"}],
                [{personalityId: "p-1", name: "Ada"}],
            ),
        ).toBeNull();
    });

    it("treats a live personality on a provider without live as the fallback", () => {
        const ada = new VoiceAssistant(
            "p-1",
            "Ada",
            "Female",
            0.8,
            "",
            1,
            10,
            "1",
            "smart",
            {live: true},
        );
        const withoutLive = new AssistantModel(
            1,
            "text-model",
            "Text",
            false,
            null,
            capabilitiesFrom({tools: true, live: false}, false),
            "key",
            true,
        );
        const withLive = new AssistantModel(
            1,
            "live-model",
            "Live",
            false,
            null,
            capabilitiesFrom({tools: true, live: true}, false),
            "key",
            true,
        );
        expect(livePathUnavailable(ada, [withoutLive])).toBeTrue();
        expect(livePathUnavailable(ada, [withLive])).toBeFalse();
        expect(livePathUnavailable(ada, [])).toBeFalse();
        const turnBased = new VoiceAssistant(
            "p-1",
            "Ada",
            "Female",
            0.8,
            "",
            1,
            10,
            "1",
        );
        expect(livePathUnavailable(turnBased, [withoutLive])).toBeFalse();
    });
});
