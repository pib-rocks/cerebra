// TypeScript implementation of a ROS std_msgs Header (standard Messages)
import {RosTime} from "./rosTime";

export function createDefaultStdMessageHeader(): StdMessageHeader {
    const now = new Date();
    const stamp: RosTime = {
        sec: Math.round(now.getTime() / 1000),
        nanosec: 0,
    };

    const stdMessageHeader: StdMessageHeader = {
        stamp,
        //the frame_id specifies the environment the data should be interpreted it
        //possible examples could be "camera_frame" oder "lidar_frame"
        //as of right now, frames are unused in the pib-project, so a default value is assigned
        frame_id: "motor_frame",
    };

    return stdMessageHeader;
}

export type StdMessageHeader = {
    stamp: RosTime;
    frame_id: string;
};
