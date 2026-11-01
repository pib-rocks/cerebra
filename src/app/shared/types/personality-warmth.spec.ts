import {
    UNKNOWN_PERSONALITY_WARMTH,
    parsePersonalityWarmth,
    warmthCssClass,
    warmthLabel,
    warmthReasonLabel,
    warmthTooltip,
    warmingPersonality,
} from "./personality-warmth";

describe("personality warmth (PR-2130)", () => {
    it("reads a warm answer as warm", () => {
        const warmth = parsePersonalityWarmth({
            personalityId: "p-1",
            state: "warm",
            warm: true,
        });

        expect(warmth.state).toBe("warm");
        expect(warmth.warm).toBeTrue();
        expect(warmth.personalityId).toBe("p-1");
    });

    it("keeps a cold answer cold and carries the reason and duration", () => {
        const warmth = parsePersonalityWarmth({
            state: "cold",
            warm: false,
            reason: "no_provider_key",
            elapsedMs: 12.5,
        });

        expect(warmth.state).toBe("cold");
        expect(warmth.reason).toBe("no_provider_key");
        expect(warmth.elapsedMs).toBe(12.5);
    });

    it("maps the direct channel and an unreadable body onto their own states", () => {
        expect(parsePersonalityWarmth({state: "not_supported"}).state).toBe(
            "notSupported",
        );
        expect(parsePersonalityWarmth({state: "nonsense"}).state).toBe(
            "unknown",
        );
        expect(parsePersonalityWarmth(null).state).toBe("unknown");
        expect(parsePersonalityWarmth("boom").state).toBe("unknown");
    });

    it("treats an unreadable state as unknown, never as cold", () => {
        expect(parsePersonalityWarmth({}).state).toBe("unknown");
        expect(parsePersonalityWarmth({}).warm).toBeFalse();
        expect(UNKNOWN_PERSONALITY_WARMTH.state).toBe("unknown");
    });

    it("colours warm green, cold amber and everything else neutral", () => {
        expect(warmthCssClass("warm")).toBe("voice-status-chip-warm");
        expect(warmthCssClass("cold")).toBe("voice-status-chip-cold");
        expect(warmthCssClass("warming")).toBe("voice-status-chip-neutral");
        expect(warmthCssClass("unknown")).toBe("voice-status-chip-neutral");
        expect(warmthCssClass("notSupported")).toBe(
            "voice-status-chip-neutral",
        );
    });

    it("labels each state for the chip", () => {
        expect(warmthLabel({state: "warm", warm: true})).toBe("warm");
        expect(warmthLabel({state: "cold", warm: false})).toBe("cold");
        expect(warmthLabel(warmingPersonality(null))).toBe("warming…");
        expect(warmthLabel({state: "notSupported", warm: false})).toBe(
            "direct · no warm-up",
        );
        expect(warmthLabel(null)).toBe("not checked");
    });

    it("explains what the state means for the next turn", () => {
        expect(
            warmthTooltip({state: "warm", warm: true, elapsedMs: 1980.4}),
        ).toBe("The next turn starts warm. The agent was built in 1980 ms.");
        expect(warmthTooltip({state: "cold", warm: false})).toContain(
            "pays the cold start",
        );
        expect(
            warmthTooltip({
                state: "cold",
                warm: false,
                reason: "no_provider_key",
            }),
        ).toContain("no provider key stored");
        expect(warmthTooltip(warmingPersonality(null))).toContain(
            "No tokens are used",
        );
        expect(warmthTooltip({state: "notSupported", warm: false})).toContain(
            "direct channel",
        );
        expect(warmthTooltip(null)).toContain("not checked");
    });

    it("keeps the browser's own warm-up state distinct from the daemon's answer", () => {
        const warming = warmingPersonality({
            personalityId: "p-1",
            state: "cold",
            warm: false,
        });

        expect(warming.state).toBe("warming");
        expect(warming.warm).toBeFalse();
        expect(warming.personalityId).toBe("p-1");
        expect(warmthReasonLabel("daemon_unreachable")).toBe(
            "hermes-daemon unreachable",
        );
        expect(warmthReasonLabel("something_new")).toBe("something_new");
        expect(warmthReasonLabel(null)).toBe("");
    });
});
