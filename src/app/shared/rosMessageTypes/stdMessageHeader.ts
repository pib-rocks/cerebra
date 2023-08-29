// TypeScript implementation of a ROS std_msgs Header (stdandard Messages)
import {rosTime} from "./rosTime";

export type stdMessageHeader = {
    stamp: rosTime;
    frame_id: string;
};

export function createDefaultStdMessageHeader(): stdMessageHeader {
    const now = new Date();
    const stamp: rosTime = {
        sec: Math.round(now.getTime() / 1000),
        nanosec: 0,
    };

    const stdMessageHeader: stdMessageHeader = {
        stamp,
        //the frame_id specifies the environment the data should be interpreted it
        //possible examples could be "camera_frame" oder "lidar_frame"
        //as of right now, frames are unused in the pib-project, so a default value is assigned
        frame_id: "motor_frame",
    };

    return stdMessageHeader;
}
