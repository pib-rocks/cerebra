export interface Detection {
    label: string;
    score: number;
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
    keypoint_names: string[];
    keypoint_x: number[];
    keypoint_y: number[];
    keypoint_z: number[];
    scalar_names: string[];
    scalar_values: number[];
}

export interface DetectionArray {
    model_id: string;
    frame_width: number;
    frame_height: number;
    detections: Detection[];
}
