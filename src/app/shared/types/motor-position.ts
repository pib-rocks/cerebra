import {JointTrajectoryMessage} from "../ros-types/msg/joint-trajectory-message";

export interface MotorPosition {
    motorName: string;
    position: number;
}

export function fromJointTrajectory(jt: JointTrajectoryMessage) {
    return {
        motorName: jt.joint_names[0],
        position: jt.points[0].positions[0],
    };
}
