import {SidebarElement} from "../interfaces/sidebar-element.interface";

export class VoiceAssistant implements SidebarElement {
    personalityId: string;
    name: string;
    description: string | undefined;
    gender: string;
    pauseThreshold: number;
    assistantModelId: number;
    messageHistory: number;

    constructor(
        personalityId: string,
        name: string,
        gender: string,
        pauseThreshold: number,
        description?: string,
        assistantModelId?: number,
        messageHistory?: number,
    ) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description ?? "";
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
        this.assistantModelId = assistantModelId ?? -1;
        this.messageHistory = messageHistory ?? 10;
    }
    getName(): string {
        return this.name;
    }
    getUUID(): string {
        return this.personalityId;
    }

    clone(): VoiceAssistant {
        return new VoiceAssistant(
            String(this.personalityId),
            String(this.name),
            String(this.gender),
            Number(this.pauseThreshold),
            String(this.description),
            Number(this.assistantModelId),
            Number(this.messageHistory),
        );
    }
}

export class VoiceAssistantDto {
    name: string;
    description: string | null;
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
        assistantModelId: voiceAssistant.assistantModelId,
    } as VoiceAssistantDto;
}

export function parseDtoToVoiceAssistant(
    dummyVoiceAssistant: VoiceAssistant,
): VoiceAssistant {
    return new VoiceAssistant(
        dummyVoiceAssistant.personalityId,
        dummyVoiceAssistant.name,
        dummyVoiceAssistant.gender,
        dummyVoiceAssistant.pauseThreshold,
        dummyVoiceAssistant.description,
        dummyVoiceAssistant.assistantModelId,
    );
}
