import {capabilitiesFrom, ProviderCapabilities} from "./provider-registry";

export class AssistantModel {
    constructor(
        public id: number,
        public apiName: string,
        public visualName: string,
        public hasImageSupport: boolean,
        public endpointBase: string | null = null,
        public capabilities: ProviderCapabilities = capabilitiesFrom(
            undefined,
            hasImageSupport,
        ),
        public credentialRef: string | null = null,
        public isDefault: boolean = false,
        public retired: boolean = false,
    ) {}

    getId(): number {
        return this.id;
    }

    getVisualName(): string {
        return this.visualName;
    }

    static parseDtoToAssistantModel(model: AssistantModelDto) {
        const capabilities = capabilitiesFrom(
            model.capabilities,
            Boolean(model.hasImageSupport),
        );
        return new AssistantModel(
            model.id,
            model.apiName,
            model.visualName,
            capabilities.images,
            model.endpointBase ?? null,
            capabilities,
            model.credentialRef ?? null,
            Boolean(model.isDefault),
            model.retired === true || model.status === "retired",
        );
    }
}

export interface AssistantModelDto {
    id: number;
    apiName: string;
    visualName: string;
    hasImageSupport?: boolean;
    endpointBase?: string | null;
    capabilities?: Partial<ProviderCapabilities> | null;
    credentialRef?: string | null;
    isDefault?: boolean;
    retired?: boolean;
    /** Catalogue status. "retired" is the same fact as retired: true. */
    status?: string;
}
