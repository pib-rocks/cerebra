export type ModelState = "idle" | "starting" | "running" | "failed";

export interface ModelStatus {
    model_id: string;
    state: ModelState;
    fps: number;
    active: boolean;
}

export interface ModelStatusArray {
    models: ModelStatus[];
}
