export class personalityDto {
    constructor(personalityId, name, description, gender, pauseThreshold){
        this.personalityId = personalityId;
        this.name = name;
        this.description = description;
        this.gender = gender;
        this.pauseThreshold = pauseThreshold;
    }

    static getPersonalityDTO(personality){
        return new personalityDto(
            personality.personalityId,
            personality.name,
            personality.description,
            personality.gender,
            personality.pauseThreshold
        )
    }

    static postPersonalityDTO(name, gender, pauseThreshold){
        return new personalityDto(
            Math.floor(Math.random() * (1000 - 10 + 1) + 10),
            name,
            "",
            gender,
            pauseThreshold
        )
    }
}
export default personalityDto