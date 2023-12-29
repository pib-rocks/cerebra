export interface SetVoiceAssistantStateRequest {
    turned_on: boolean;
    chat_id: string;
}

export interface SetVoiceAssistantStateResponse {
    successful: boolean;
}
