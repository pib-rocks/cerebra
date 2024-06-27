import {JointTrajectoryMessage} from "../msg/joint-trajectory-message";

export interface ApplyJointTrajectoryRequest {
    joint_trajectory: JointTrajectoryMessage;
}

export interface ApplyJointTrajectoryResponse {
    successful: boolean;
}
