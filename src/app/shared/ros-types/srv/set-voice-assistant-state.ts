import {VoiceAssistantState} from "../msg/voice-assistant-state";

export interface SetVoiceAssistantStateRequest {
    voice_assistant_state: VoiceAssistantState;
}

export interface SetVoiceAssistantStateResponse {
    successful: boolean;
}
