import {stdMessageHeader} from "./stdMessageHeader";
import {
    jointTrajectoryPoint,
    createJointTrajectoryPoint,
} from "./jointTrajectoryPoint";
import {createDefaultStdMessageHeader} from "./stdMessageHeader";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type jointTrajectoryMessage = {
    header: stdMessageHeader;
    joint_names: string[];
    points: jointTrajectoryPoint[];
};

export function createEmptyJointTrajectoryMessage(): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: <string[]>[],
        points: <jointTrajectoryPoint[]>[],
    };

    return jointTrajectoryMessage;
}

export function createSinglePositionJointTrajectoryMessage(
    jointName: string,
    position: number,
): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: new Array<string>(),
        points: new Array<jointTrajectoryPoint>(),
    };

    jointTrajectoryMessage.joint_names.push(jointName);
    jointTrajectoryMessage.points.push(createJointTrajectoryPoint(position));

    return jointTrajectoryMessage;
}
