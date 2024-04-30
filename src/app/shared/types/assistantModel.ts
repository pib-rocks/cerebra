export class AssistantModel {
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

    static parseDtoToAssistantModel(model: AssistantModelDto) {
        return new AssistantModel(
            model.id,
            model.apiName,
            model.visualName,
            model.hasImageSupport,
        );
    }
}

export class AssistantModelDto {
    constructor(
        public id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
    ) {}
}
