import {typedTextJoinsLive} from "./live-interaction";

describe("typed text in a live session", () => {
    it("joins the open live chat and leaves that session interruptible", () => {
        expect(
            typedTextJoinsLive({
                liveOpen: true,
                liveChatId: "chat-live",
                messageChatId: "chat-live",
                text: "  hello there  ",
            }),
        ).toEqual({
            join: true,
            interrupt: true,
            text: "hello there",
            keepSession: true,
        });

        const other = typedTextJoinsLive({
            liveOpen: true,
            liveChatId: "chat-live",
            messageChatId: "chat-other",
            text: "hello there",
        });
        expect(other.join).toBeFalse();
        expect(other.keepSession).toBeTrue();

        const blank = typedTextJoinsLive({
            liveOpen: true,
            liveChatId: "chat-live",
            messageChatId: "chat-live",
            text: "   ",
        });
        expect(blank.join).toBeFalse();

        const closed = typedTextJoinsLive({
            liveOpen: false,
            liveChatId: "chat-live",
            messageChatId: "chat-live",
            text: "hello there",
        });
        expect(closed.join).toBeFalse();
        expect(closed.keepSession).toBeFalse();
    });
});
