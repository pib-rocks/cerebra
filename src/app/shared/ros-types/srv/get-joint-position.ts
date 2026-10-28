export interface GetJointPositionRequest {
    joint_name: string;
}

export interface GetJointPositionResponse {
    successful: boolean;
    position: number;
    message: string;
}
