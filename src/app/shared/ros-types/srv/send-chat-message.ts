export interface SendChatMessageRequest {
    chat_id: string;
    content: string;
}

export interface SendChatMessageResponse {
    successful: boolean;
}
