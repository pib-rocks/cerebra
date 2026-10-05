function capabilitiesFrom(model) {
    const raw = model.capabilities;
    const images =
        raw != null && raw.images != null
            ? Boolean(raw.images)
            : Boolean(model.hasImageSupport);
    return {
        tools: Boolean(raw?.tools),
        images,
        live: Boolean(raw?.live),
        stt: Boolean(raw?.stt),
        tts: Boolean(raw?.tts),
    };
}

export class AssistantModel {
    constructor(
        id,
        apiName,
        hasImageSupport,
        visualName,
        endpointBase,
        capabilities,
        credentialRef,
        isDefault,
    ) {
        this.id = id;
        this.apiName = apiName;
        this.hasImageSupport = hasImageSupport;
        this.visualName = visualName;
        this.endpointBase = endpointBase;
        this.capabilities = capabilities;
        this.credentialRef = credentialRef;
        this.isDefault = isDefault;
    }

    static getAssistantModel(model) {
        const capabilities = capabilitiesFrom(model);
        return new AssistantModel(
            model.id,
            model.apiName,
            capabilities.images,
            model.visualName,
            model.endpointBase ?? null,
            capabilities,
            model.credentialRef ?? null,
            Boolean(model.isDefault),
        );
    }
}
export default AssistantModel;
