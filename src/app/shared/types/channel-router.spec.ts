import {
    DEFAULT_CHAT_CHANNEL,
    DIRECT_CHANNEL,
    SMART_CHANNEL,
    effectiveChannel,
    identityText,
    parseChatChannel,
    routeTurn,
    showSmartChannelControl,
    transportRequest,
} from "./channel-router";

describe("channel router", () => {
    const soul = "Du bist pib, ein humanoider Roboter.";
    const memory = "The visitor prefers short answers.";

    it("defaults an unset channel to Smart", () => {
        expect(parseChatChannel(undefined)).toBe(DEFAULT_CHAT_CHANNEL);
        expect(parseChatChannel(null)).toBe(SMART_CHANNEL);
        expect(parseChatChannel("")).toBe(SMART_CHANNEL);
        expect(parseChatChannel("other")).toBe(SMART_CHANNEL);
        expect(parseChatChannel(DIRECT_CHANNEL)).toBe(DIRECT_CHANNEL);
    });

    it("keeps one identity text when the channel changes", () => {
        expect(identityText(soul)).toBe(soul);
        expect(identityText(undefined)).toBe("");
        const smart = routeTurn({
            channel: SMART_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content: "hello",
        });
        const direct = routeTurn({
            channel: DIRECT_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content: "hello",
        });
        expect(identityText(soul)).toBe(smart.systemPrompt ?? soul);
        expect(direct.systemPrompt).toBe(soul);
        expect(direct.content).toBe(smart.content);
    });

    it("sends the SOUL text as the Direct system prompt and keeps MEMORY on Smart", () => {
        const direct = routeTurn({
            channel: DIRECT_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content: "hello",
        });
        expect(direct.channel).toBe(DIRECT_CHANNEL);
        expect(direct.systemPrompt).toBe(soul);
        expect(direct.memory).toBeNull();

        const smart = routeTurn({
            channel: SMART_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content: "hello",
        });
        expect(smart.channel).toBe(SMART_CHANNEL);
        expect(smart.systemPrompt).toBeNull();
        expect(smart.memory).toBe(memory);
    });

    it("uses one transport request for both channels", () => {
        const content = "hello";
        const smart = routeTurn({
            channel: SMART_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content,
        });
        const direct = routeTurn({
            channel: DIRECT_CHANNEL,
            smartChatsEnabled: true,
            soul,
            memory,
            content,
        });
        const chatId = "chat-1";
        expect(transportRequest(chatId, smart)).toEqual({
            chat_id: chatId,
            content,
        });
        expect(transportRequest(chatId, direct)).toEqual(
            transportRequest(chatId, smart),
        );
    });

    it("forces Direct and hides Smart when the installer disabled Hermes", () => {
        expect(showSmartChannelControl(false)).toBeFalse();
        expect(showSmartChannelControl(true)).toBeTrue();
        expect(effectiveChannel(SMART_CHANNEL, false)).toBe(DIRECT_CHANNEL);
        const turn = routeTurn({
            channel: SMART_CHANNEL,
            smartChatsEnabled: false,
            soul,
            memory,
            content: "hello",
        });
        expect(turn.channel).toBe(DIRECT_CHANNEL);
        expect(turn.systemPrompt).toBe(soul);
        expect(turn.memory).toBeNull();
        expect(parseChatChannel(SMART_CHANNEL)).toBe(SMART_CHANNEL);
    });
});
