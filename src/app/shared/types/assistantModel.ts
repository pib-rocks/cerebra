export class AssistantModel {
    constructor(
        public modelId: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}

    getId(): number {
        return this.modelId;
    }

    getVisualName(): string {
        return this.visualName;
    }

    static parseDtoToAssistantModel(model: AssistantModelDto) {
        return new AssistantModel(
            model.modelId,
            model.apiName,
            model.visualName,
            model.hasImageSupport,
        );
    }
}

export class AssistantModelDto {
    constructor(
        public modelId: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}
}
