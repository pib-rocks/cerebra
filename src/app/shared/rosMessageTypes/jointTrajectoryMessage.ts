import {stdMessageHeader} from "./stdMessageHeader";
import {jointTrajectoryPoint} from "./jointTrajectoryPoint";
import {createDefaultStdMessageHeader} from "./stdMessageHeader";

// TypeScript implementation of the ROS Common-Interfaces JointTrajectoryMessage
// Documentation at: https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg
export type jointTrajectoryMessage = {
    header: stdMessageHeader;
    joint_names: string[];
    points: jointTrajectoryPoint[];
};

// export function createDefaultJointTrajectoryMessage(): jointTrajectoryMessage {
//     const jointTrajectoryMessage: jointTrajectoryMessage = {
//         header: createDefaultStdMessageHeader(),
//         joint_names: new Array<string>(),
//         points: new Array<jointTrajectoryPoint>(),
//     };

//     return jointTrajectoryMessage;
// }
export function createDefaultJointTrajectoryMessage(): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDefaultStdMessageHeader(),
        joint_names: <string[]>[],
        points: <jointTrajectoryPoint[]>[],
    };

    return jointTrajectoryMessage;
}

// ROSLIB.Message({
//         header : {
//           frame_id  : payload.frame_id
//         },
//         joint_names : payload.joint_names,
//         points : [
//           {
//             positions : payload.joint_values, // array of positions e.g. [1,0,0.3,...]
//             velocities : [],
//             accelerations : [],
//             effort : [],
//             time_from_start : payload.time_from_start
//           }
//         ]
//       });
