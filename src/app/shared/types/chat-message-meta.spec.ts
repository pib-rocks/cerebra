import {
    failureNotice,
    hasMeta,
    imageAttachments,
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

    it("names the cause and the tool calls", () => {
        const lines = metaSummary({
            source: "local",
            fallbackReason: "cloud_token_unavailable",
            toolCalls: [
                {name: "capture_image", ok: false, durationMs: 12.4},
                {name: "set_led", ok: true},
            ],
        });
        expect(lines[0]).toBe("On-device");
        // An unknown code stays readable as itself; a known one gets a label.
        expect(lines).toContain("cause: cloud_token_unavailable");
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

    // PR-2132: a failed turn says why. The old answer claimed a timeout for
    // every failure; the cause is what the operator needs.
    it("labels a known failure cause instead of only the code", () => {
        const lines = metaSummary({
            source: "hermes",
            fallbackReason: "hermes_home_read_only",
        });

        expect(lines).toContain("cause: Speicher schreibgeschützt (Errno 30)");
    });

    it("puts a visible failure line above the collapsed details", () => {
        const html = metaHtml({
            source: "hermes",
            fallbackReason: "hermes_home_read_only",
        });

        expect(html).toContain('data-test="CHAT_MESSAGE_FAILURE"');
        expect(html).toContain("⚠ Speicher schreibgeschützt (Errno 30)");
        expect(html.indexOf("CHAT_MESSAGE_FAILURE")).toBeLessThan(
            html.indexOf("CHAT_MESSAGE_META"),
        );
    });

    it("adds no failure line to an answer that worked", () => {
        expect(failureNotice({source: "hermes", streamEnd: "done"})).toBe("");
        expect(failureNotice(null)).toBe("");
        expect(failureNotice({fallbackReason: "something_new_entirely"})).toBe(
            "",
        );
        expect(metaHtml({source: "hermes"})).not.toContain(
            "CHAT_MESSAGE_FAILURE",
        );
    });

    it("escapes the visible failure line", () => {
        const html = metaHtml({
            fallbackReason: "hermes_home_read_only",
            source: "<b>hermes</b>",
        });

        expect(html).not.toContain("<b>hermes</b>");
        expect(html).toContain("&lt;b&gt;hermes&lt;/b&gt;");
    });

    it("turns a captured picture into an attachment under the API base", () => {
        const attachments = imageAttachments({
            images: [
                {
                    id: "image-1",
                    mimeType: "image/jpeg",
                    width: 1024,
                    height: 768,
                    url: "/voice-assistant/chat/c1/messages/m1/images/0",
                },
            ],
        });

        expect(attachments).toEqual([
            {
                src: "/api/voice-assistant/chat/c1/messages/m1/images/0",
                type: "image",
                name: "capture.jpg",
            },
        ]);
    });

    it("keeps a fully qualified picture url as it is", () => {
        const attachments = imageAttachments(
            {images: [{url: "https://robot.local/api/chat/image/1"}]},
            "/api/",
        );

        expect(attachments[0].src).toBe("https://robot.local/api/chat/image/1");
    });

    it("skips a reference without a url instead of painting a broken picture", () => {
        expect(
            imageAttachments({images: [{id: "image-1"}, {url: "  "}]}),
        ).toEqual([]);
    });

    it("has no attachments for a turn without images", () => {
        expect(imageAttachments(null)).toEqual([]);
        expect(imageAttachments({source: "pib-cloud"})).toEqual([]);
    });

    it("counts a captured picture as metadata worth showing", () => {
        expect(
            hasMeta({
                images: [{url: "/voice-assistant/chat/c/messages/m/images/0"}],
            }),
        ).toBe(true);
    });
});
