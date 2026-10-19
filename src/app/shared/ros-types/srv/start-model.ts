export interface StartModelRequest {
    model_id: string;
    shaves: number;
    owner: string;
}

export interface ModelActionResponse {
    success: boolean;
    message: string;
}
