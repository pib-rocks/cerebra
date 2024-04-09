export class VoiceAssistantModel {
    constructor(
        public id: number,
        public apiName: string,
        public visualName: string,
        public has_image_support: boolean,
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
            model.api_name,
            model.visual_name,
            model.has_image_support,
        );
    }
}

export class VoiceAssistantModelDto {
    constructor(
        public id: number,
        public api_name: string,
        public visual_name: string,
        public has_image_support: boolean,
    ) {}
}
