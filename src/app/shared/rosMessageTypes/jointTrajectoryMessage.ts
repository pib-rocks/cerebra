import {
    StdMessageHeader,
    createDefaultStdMessageHeader,
} from "./stdMessageHeader";
import {JointTrajectoryPoint} from "./jointTrajectoryPoint";

export function createEmptyJointTrajectoryMessage(): JointTrajectoryMessage {
    const jointTrajectoryMessage: JointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: <string[]>[],
        points: <JointTrajectoryPoint[]>[],
    };

    return jointTrajectoryMessage;
}
// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type JointTrajectoryMessage = {
    header: StdMessageHeader;
    joint_names: string[];
    points: JointTrajectoryPoint[];
};
