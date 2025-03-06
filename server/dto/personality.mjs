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
    }

    static getPersonality(personality) {
        return new Personality(
            personality.personalityId,
            personality.name,
            personality.description,
            personality.gender,
            personality.pauseThreshold,
            personality.assistantModelId,
            personality.messageHistory,
        );
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
