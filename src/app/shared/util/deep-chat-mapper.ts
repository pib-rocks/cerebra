import {ChatMessage} from "src/app/shared/types/chat-message";

export interface MessageContent {
    role: "ai" | "user" | string;
    text?: string;
    html?: string;
    files?: unknown[];
    custom?: unknown;
}

export function toDeepChat(m: ChatMessage): MessageContent {
    return {role: m.isUser ? "user" : "ai", text: m.content};
}

export function extractText(body: {messages: MessageContent[]}): string {
    return body.messages[body.messages.length - 1]?.text ?? "";
}
