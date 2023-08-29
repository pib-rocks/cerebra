import {stdMessageHeader} from "./stdMessageHeader";
import {jointTrajectoryPoint} from "./jointTrajectoryPoint";
import {createDefaultStdMessageHeader} from "./stdMessageHeader";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type jointTrajectoryMessage = {
    header: stdMessageHeader;
    joint_names: string[];
    points: jointTrajectoryPoint[];
};

export function createDefaultJointTrajectoryMessage(): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: new Array<string>(),
        points: new Array<jointTrajectoryPoint>(),
    };

    return jointTrajectoryMessage;
}
