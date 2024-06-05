import {
    StdMessageHeader,
    createDefaultStdMessageHeader,
} from "./std-message-header";
import {JointTrajectoryPoint} from "./joint-trajectory-point";

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

export function fromMotorPosition(motorname: string, position: number) {
    return {
        header: {
            stamp: {
                sec: 0,
                nanosec: 0,
            },
            frame_id: "",
        },
        joint_names: [motorname],
        points: [
            {
                positions: [position],
                time_from_start: {sec: 0, nanosec: 0},
            },
        ],
    };
}
