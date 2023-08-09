import {rosTime} from "./rosTime";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type jointTrajectoryPoint = {
    positions: Float64Array;
    velocities?: Float64Array;
    accelerations?: Float64Array;
    effort?: Float64Array;
    time_from_start: rosTime;
};
