export interface VoiceAssistantRequest {
    chat_id: string;
    pause_threshold: number;
}

export interface VoiceAssistantResponse {
    successful: boolean;
}

export interface VoiceAssistantFeedback {
    message_id: string;
    timestamp: string;
    is_user: boolean;
    content: string;
}
