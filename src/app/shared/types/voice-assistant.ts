import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {
    DEFAULT_PROVIDER_REF,
    providerRefFromSelection,
} from "./provider-registry";

export class VoiceAssistant implements SidebarElement {
    personalityId: string;
    name: string;
    description: string | undefined;
    gender: string;
    pauseThreshold: number;
    assistantModelId: number | null;
    messageHistory: number;
    providerRef: string;

    constructor(
        personalityId: string,
        name: string,
        gender: string,
        pauseThreshold: number,
        description?: string,
        assistantModelId?: number | null,
        messageHistory?: number,
        providerRef?: string | null,
    ) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description ?? "";
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
        this.assistantModelId =
            assistantModelId == null || assistantModelId < 1
                ? null
                : assistantModelId;
        this.messageHistory = messageHistory ?? 10;
        if (providerRef != null && providerRef !== "") {
            this.providerRef = providerRef;
        } else if (this.assistantModelId != null) {
            this.providerRef = String(this.assistantModelId);
        } else {
            this.providerRef = DEFAULT_PROVIDER_REF;
        }
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
            this.assistantModelId,
            Number(this.messageHistory),
            this.providerRef,
        );
    }
}

export interface VoiceAssistantDto {
    name: string;
    description: string | null | undefined;
    gender: string;
    pauseThreshold: number;
    assistantModelId: number | null;
    messageHistory: number;
    providerRef: string;
}

export function parseVoiceAssistantToDto(
    voiceAssistant: VoiceAssistant,
): VoiceAssistantDto {
    const choice = providerRefFromSelection(voiceAssistant.providerRef);
    return {
        name: voiceAssistant.name,
        description: voiceAssistant.description,
        gender: voiceAssistant.gender,
        pauseThreshold: voiceAssistant.pauseThreshold,
        assistantModelId: choice.assistantModelId,
        messageHistory: voiceAssistant.messageHistory,
        providerRef: choice.providerRef,
    };
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
        dummyVoiceAssistant.messageHistory,
        dummyVoiceAssistant.providerRef,
    );
}
