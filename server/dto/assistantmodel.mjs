export class AssistantModel {
    constructor(id, apiName, hasImageSupport, visualName) {
        this.id = id;
        this.apiName = apiName;
        this.hasImageSupport = hasImageSupport;
        this.visualName = visualName;
    }

    static getAssistantModel(model) {
        return new AssistantModel(
            model.id,
            model.apiName,
            model.hasImageSupport,
            model.visualName,
        );
    }
}
export default AssistantModel;
