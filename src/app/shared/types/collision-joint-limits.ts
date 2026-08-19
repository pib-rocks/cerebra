import {JointTrajectoryMessage} from "../ros-types/msg/joint-trajectory-message";

export type CollisionJointLimits = {
    motorName: string;
    minimum: number;
    maximum: number;
};

export function fromCollisionJointLimits(
    message: JointTrajectoryMessage,
): CollisionJointLimits | null {
    const motorName = message.joint_names[0];
    const minimum = Number(message.points[0]?.positions[0]);
    const maximum = Number(message.points[1]?.positions[0]);
    if (
        !motorName ||
        !Number.isFinite(minimum) ||
        !Number.isFinite(maximum)
    ) {
        return null;
    }
    return {motorName, minimum, maximum};
}
