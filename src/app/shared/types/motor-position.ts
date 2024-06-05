import {JointTrajectoryMessage} from "../ros-types/msg/joint-trajectory-message";

export interface MotorPosition {
    motorname: string;
    position: number;
}

export function fromJointTrajectory(jt: JointTrajectoryMessage) {
    return {
        motorname: jt.joint_names[0],
        position: jt.points[0].positions[0],
    };
}
