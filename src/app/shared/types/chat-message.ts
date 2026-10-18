import {ChatMessageMeta} from "./chat-message-meta";

export interface ChatMessage {
    messageId: string;
    timestamp: string;
    isUser: boolean;
    content: string;
    /** Facts of the turn that produced this answer (PC-82); null for user lines. */
    meta?: ChatMessageMeta | null;
}
