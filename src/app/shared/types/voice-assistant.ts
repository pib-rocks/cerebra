export interface VoiceAssistant {
    personalityId: string;
    name: string;
    description: string;
    gender: string;
    pauseThreshold: number;
}

export interface VoiceAssistantDto {
    name: string;
    description: string;
    gender: string;
    pauseThreshold: number;
}

export function parseVoiceAssistantToDto(
    voiceAssistant: VoiceAssistant,
): VoiceAssistantDto {
    return {
        name: voiceAssistant.name,
        description: voiceAssistant.description,
        gender: voiceAssistant.gender,
        pauseThreshold: voiceAssistant.pauseThreshold,
    } as VoiceAssistantDto;
}
