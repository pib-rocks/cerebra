export class AssistantModel {
    constructor(
        public model_id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}

    getId(): number {
        return this.model_id;
    }

    getVisualName(): string {
        return this.visualName;
    }

    static parseDtoToAssistantModel(model: AssistantModelDto) {
        return new AssistantModel(
            model.model_id,
            model.apiName,
            model.visualName,
            model.hasImageSupport,
        );
    }
}

export class AssistantModelDto {
    constructor(
        public model_id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}
}
