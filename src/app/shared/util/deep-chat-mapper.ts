import {ChatMessage} from "src/app/shared/types/chat-message";
import {metaHtml} from "src/app/shared/types/chat-message-meta";

export interface MessageContent {
    role: "ai" | "user" | string;
    text?: string;
    html?: string;
    files?: unknown[];
    custom?: unknown;
}

export function toDeepChat(m: ChatMessage): MessageContent {
    const content: MessageContent = {
        role: m.isUser ? "user" : "ai",
        text: m.content,
    };
    // Turn details of an answer (PC-82): a collapsed block under the text.
    const details = m.isUser ? "" : metaHtml(m.meta);
    if (details) {
        content.html = details;
    }
    return content;
}

export function extractText(body: {messages: MessageContent[]}): string {
    return body.messages[body.messages.length - 1]?.text ?? "";
}
