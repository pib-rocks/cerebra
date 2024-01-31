export interface ChatMessage {
    chat_id: string;
    message_id: string;
    timestamp: string;
    is_user: boolean;
    content: string;
}
