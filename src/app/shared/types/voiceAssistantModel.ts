export class VoiceAssistantModel {
    constructor(
        public id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}

    getId(): number {
        return this.id;
    }

    getVisualName(): string {
        return this.visualName;
    }

    static parseDtoToVoiceAssistantModel(model: VoiceAssistantModelDto) {
        return new VoiceAssistantModel(
            model.id,
            model.apiName,
            model.visualName,
            model.hasImageSupport,
        );
    }
}

export class VoiceAssistantModelDto {
    constructor(
        public id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}
}
