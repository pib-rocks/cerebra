import {VoiceAssistantState} from "./VoiceAssistantState";

export interface SetVoiceAssistantStateRequest {
    voice_assistant_state: VoiceAssistantState;
}

export interface SetVoiceAssistantStateResponse {
    successful: boolean;
}
