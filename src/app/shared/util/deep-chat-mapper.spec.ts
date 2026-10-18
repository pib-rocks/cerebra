import {ChatMessage} from "src/app/shared/types/chat-message";
import {extractText, toDeepChat} from "./deep-chat-mapper";

describe("toDeepChat", () => {
    const baseMessage: Omit<ChatMessage, "isUser" | "content"> = {
        messageId: "msg-1",
        timestamp: "2026-08-01T12:00:00Z",
    };

    it("should map a user message to role user", () => {
        const message: ChatMessage = {
            ...baseMessage,
            isUser: true,
            content: "Hello",
        };

        expect(toDeepChat(message)).toEqual({role: "user", text: "Hello"});
    });

    it("should map an AI message to role ai", () => {
        const message: ChatMessage = {
            ...baseMessage,
            isUser: false,
            content: "Hi there",
        };

        expect(toDeepChat(message)).toEqual({role: "ai", text: "Hi there"});
    });

    it("should map empty content", () => {
        const message: ChatMessage = {
            ...baseMessage,
            isUser: false,
            content: "",
        };

        expect(toDeepChat(message)).toEqual({role: "ai", text: ""});
    });
});

describe("extractText", () => {
    it("should return an empty string when messages is empty", () => {
        expect(extractText({messages: []})).toBe("");
    });

    it("should return the text of a single message", () => {
        expect(extractText({messages: [{role: "user", text: "only"}]})).toBe(
            "only",
        );
    });

    it("should return the text of the last message when multiple are present", () => {
        expect(
            extractText({
                messages: [
                    {role: "user", text: "first"},
                    {role: "ai", text: "second"},
                    {role: "user", text: "last"},
                ],
            }),
        ).toBe("last");
    });

    it("should return an empty string when the last message text is undefined", () => {
        expect(extractText({messages: [{role: "user"}]})).toBe("");
    });

    it("adds the turn details of an answer as a collapsed block", () => {
        const mapped = toDeepChat({
            messageId: "m1",
            timestamp: "2026-10-18 22:00:00",
            isUser: false,
            content: "Hallo.",
            meta: {
                source: "pib-cloud",
                model: "pib-cloud",
                stagesMs: {end_of_speech: 0, first_token: 332.1},
            },
        });

        expect(mapped.role).toBe("ai");
        expect(mapped.text).toBe("Hallo.");
        expect(mapped.html).toContain("turn details");
        expect(mapped.html).toContain("pib.Cloud · pib-cloud");
        expect(mapped.html).toContain("first token +332 ms");
    });

    it("keeps an answer without metadata plain and a user line never gets details", () => {
        const plain = toDeepChat({
            messageId: "m2",
            timestamp: "2026-10-18 22:00:00",
            isUser: false,
            content: "Ohne Metadaten.",
        });
        expect(plain.html).toBeUndefined();

        const userLine = toDeepChat({
            messageId: "m3",
            timestamp: "2026-10-18 22:00:00",
            isUser: true,
            content: "Ich.",
            meta: {source: "pib-cloud"},
        });
        expect(userLine.html).toBeUndefined();
    });
});
