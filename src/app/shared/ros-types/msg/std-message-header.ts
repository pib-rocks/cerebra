// TypeScript implementation of a ROS std_msgs Header (standard Messages)
import {RosTime} from "./ros-time";

export type StdMessageHeader = {
    stamp: RosTime;
    frame_id: string;
};

export function createDefaultStdMessageHeader(): StdMessageHeader {
    const now = new Date();
    const stamp: RosTime = {
        sec: Math.round(now.getTime() / 1000),
        nanosec: 0,
    };

    const stdMessageHeader: StdMessageHeader = {
        stamp,
        //the frame_id specifies the environment the data should be interpreted in
        //possible examples are "camera_frame" or "lidar_frame"
        //as of right now, frames are unused in the pib-project, so a default value is assigned
        frame_id: "default_frame",
    };

    return stdMessageHeader;
}
