// TypeScript implementation of a ROS std_msgs Header (stdandard Messages)
import {rosTime} from "./rosTime";

export type stdMessageHeader = {
    stamp: rosTime;
    frame_id: string;
};
