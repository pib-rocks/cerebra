import {RosTime} from "./rosTime";

export function createDefaultRosTime(): RosTime {
    const rosTime: RosTime = {
        sec: 0,
        nanosec: 100000000,
    };

    return rosTime;
}

export function createJointTrajectoryPoint(
    position: number,
): JointTrajectoryPoint {
    const jointTrajectoryPoint: JointTrajectoryPoint = {
        positions: new Array<number>(),
        time_from_start: createDefaultRosTime(),
    };
    jointTrajectoryPoint.positions.push(position);
    return jointTrajectoryPoint;
}
// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type JointTrajectoryPoint = {
    positions: number[];
    velocities?: number[];
    accelerations?: number[];
    effort?: number[];
    time_from_start: RosTime;
};
