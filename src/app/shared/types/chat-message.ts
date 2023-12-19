export interface ChatMessage {
    messageId: string;
    timestamp: string;
    isUser: boolean;
    content: string;
    chatId: string;
}
