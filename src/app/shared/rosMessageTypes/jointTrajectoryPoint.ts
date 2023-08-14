import {rosTime} from "./rosTime";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type jointTrajectoryPoint = {
    positions: number[];
    velocities?: number[];
    accelerations?: number[];
    effort?: number[];
    time_from_start: rosTime;
};
