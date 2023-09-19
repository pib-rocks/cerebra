// TypeScript implementation of a ROS std_msgs Header (standard Messages)
import {RosTime} from "./rosTime";

export type StdMessageHeader = {
    stamp: RosTime;
    frame_id: string;
};
