// TypeScript implementation of the ROS "time" and "duration" Messages
// They are condensed into one .ts-file, since they are built the exact same way
// Time documentation at:https://docs.ros2.org/foxy/api/builtin_interfaces/msg/Time.html
// Duration documentation at: https://docs.ros2.org/foxy/api/builtin_interfaces/msg/Duration.html
export type rosTime = {
    sec: number;
    nanosec: number;
};
