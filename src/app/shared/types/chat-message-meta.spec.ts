import {
    hasMeta,
    metaHtml,
    metaSummary,
    type ChatMessageMeta,
} from "./chat-message-meta";

describe("chat-message-meta", () => {
    const meta: ChatMessageMeta = {
        source: "pib-cloud",
        model: "pib-cloud",
        stagesMs: {
            end_of_speech: 0,
            request_sent: 84.4,
            first_token: 332.1,
            first_audio: 5118.9,
        },
        streamEnd: "done",
    };

    it("says nothing for absent or empty metadata", () => {
        expect(hasMeta(null)).toBe(false);
        expect(hasMeta({})).toBe(false);
        expect(metaSummary(null)).toEqual([]);
        expect(metaHtml(null)).toBe("");
    });

    it("summarises transport, model and the stages it has", () => {
        const lines = metaSummary(meta);
        expect(lines[0]).toBe("pib.Cloud · pib-cloud");
        expect(lines).toContain("request sent +84 ms");
        expect(lines).toContain("first token +332 ms");
        expect(lines).toContain("first audio +5119 ms");
        expect(lines.join("|")).not.toContain("stream done");
    });

    it("names the fallback and the tool calls", () => {
        const lines = metaSummary({
            source: "local",
            fallbackReason: "cloud_token_unavailable",
            toolCalls: [
                {name: "capture_image", ok: false, durationMs: 12.4},
                {name: "set_led", ok: true},
            ],
        });
        expect(lines[0]).toBe("On-device");
        expect(lines).toContain("fallback: cloud_token_unavailable");
        expect(lines).toContain("tool capture_image failed 12 ms");
        expect(lines).toContain("tool set_led ok");
    });

    it("renders a collapsed details block and escapes the values", () => {
        const html = metaHtml({
            source: "<script>alert(1)</script>",
            fallbackReason: 'a "quoted" reason',
        });
        expect(html).toContain("<details");
        expect(html).toContain('data-test="CHAT_MESSAGE_META"');
        expect(html).toContain("<summary>turn details</summary>");
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
        expect(html).toContain("&quot;quoted&quot;");
        expect(html).not.toContain("<details open");
    });
});
