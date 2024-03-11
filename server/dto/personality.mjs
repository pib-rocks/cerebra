import GenertateId from "../util/generateId.mjs";

export class Personality {
    constructor(personalityId, name, description, gender, pauseThreshold) {
        this.personalityId = personalityId;
        this.name = name;
        this.description = description;
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
    }

    static getPersonality(personality) {
        return new Personality(
            personality.personalityId,
            personality.name,
            personality.description,
            personality.gender,
            personality.pauseThreshold,
        );
    }

    static newPersonality(name, gender, pauseThreshold) {
        return new Personality(
            GenertateId.genertateId(),
            name,
            "",
            gender,
            pauseThreshold,
        );
    }
}
export default Personality;
