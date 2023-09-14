import {StdMessageHeader} from "./stdMessageHeader";
import {
    JointTrajectoryPoint,
    createJointTrajectoryPoint,
} from "./jointTrajectoryPoint";
import {createDefaultStdMessageHeader} from "./stdMessageHeader";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type JointTrajectoryMessage = {
    header: StdMessageHeader;
    joint_names: string[];
    points: JointTrajectoryPoint[];
};

export function createEmptyJointTrajectoryMessage(): JointTrajectoryMessage {
    const jointTrajectoryMessage: JointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: <string[]>[],
        points: <JointTrajectoryPoint[]>[],
    };

    return jointTrajectoryMessage;
}

export function createSinglePositionJointTrajectoryMessage(
    jointName: string,
    position: number,
): JointTrajectoryMessage {
    const jointTrajectoryMessage: JointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: new Array<string>(),
        points: new Array<JointTrajectoryPoint>(),
    };

    jointTrajectoryMessage.joint_names.push(jointName);
    jointTrajectoryMessage.points.push(createJointTrajectoryPoint(position));

    return jointTrajectoryMessage;
}
