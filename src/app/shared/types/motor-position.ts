import {JointTrajectoryMessage} from "../ros-types/msg/joint-trajectory-message";
import {radToCentideg} from "./joint-angle-units";

export interface MotorPosition {
    motorName: string;
    position: number;
}

export function fromJointTrajectory(jt: JointTrajectoryMessage) {
    return {
        motorName: jt.joint_names[0],
        position: radToCentideg(jt.points[0].positions[0]),
    };
}
