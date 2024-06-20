export interface ChatMessage {
    messageId: string;
    timestamp: string;
    isUser: boolean;
    content: string;
    extend_previos_message: boolean;
}
