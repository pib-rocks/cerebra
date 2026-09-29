export interface ModelInfo {
    model_id: string;
    task: string;
    licence: string;
    shaves: number[];
    size_bytes: number;
    available: boolean;
    active: boolean;
}

export interface ListModelsResponse {
    models: ModelInfo[];
}
