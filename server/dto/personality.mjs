import GenertateId from "../util/generateId.mjs";

export class Personality {
    constructor(
        personalityId,
        name,
        description,
        gender,
        pauseThreshold,
        assistantModelId,
        messageHistory,
    ) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description;
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
        this.assistantModelId = assistantModelId;
        this.messageHistory = messageHistory;
        this.providerRef = null;
        this.channel = "smart";
    }

    static getPersonality(personality) {
        const row = new Personality(
            personality.personalityId,
            personality.name,
            personality.description,
            personality.gender,
            personality.pauseThreshold,
            personality.assistantModelId,
            personality.messageHistory,
        );
        if (personality.providerRef != null && personality.providerRef !== "") {
            row.providerRef = personality.providerRef;
        } else if (
            personality.assistantModelId != null &&
            personality.assistantModelId !== ""
        ) {
            row.providerRef = String(personality.assistantModelId);
        } else {
            row.providerRef = "default";
        }
        row.channel = personality.channel === "direct" ? "direct" : "smart";
        return row;
    }

    static newPersonality(name, gender, pauseThreshold, messageHistory) {
        return new Personality(
            GenertateId.genertateId(),
            name,
            "",
            gender,
            pauseThreshold,
            messageHistory,
        );
    }
}
export default Personality;
