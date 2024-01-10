import {VoiceAssistantState} from "./VoiceAssistantState";

export interface GetVoiceAssistantStateRequest {}

export interface GetVoiceAssistantStateResponse {
    voice_assistant_state: VoiceAssistantState;
}
