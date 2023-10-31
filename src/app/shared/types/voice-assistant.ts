export class VoiceAssistant {
    personalityId: string;
    name: string;
    description: string;
    gender: string;
    pauseThreshold: number;

    constructor(
        personalityId: string,
        name: string,
        description: string,
        gender: string,
        pauseThreshold: number,
    ) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description;
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
    }
}

export class VoiceAssistantDto {
    name: string;
    description: string;
    gender: string;
    pauseThreshold: number;

    constructor(
        name: string,
        description: string,
        gender: string,
        pauseThreshold: number,
    ) {
        this.name = name;
        this.description = description;
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
    }
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
