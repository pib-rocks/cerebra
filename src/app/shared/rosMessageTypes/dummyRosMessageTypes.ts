import {stdMessageHeader} from "./stdMessageHeader";
import {rosTime} from "./rosTime";
import {jointTrajectoryPoint} from "./jointTrajectoryPoint";
import {jointTrajectoryMessage} from "./jointTrajectoryMessage";

export function createDummyStdMessageHeader(): stdMessageHeader {
    const stamp: rosTime = {
        sec: 1,
        nanosec: 2,
    };

    const stdMessageHeader: stdMessageHeader = {
        stamp,
        frame_id: "example_frame_id",
    };

    return stdMessageHeader;
}

export function createDummyJointTrajectoryPoint(): jointTrajectoryPoint {
    const time_from_start: rosTime = {
        sec: 5,
        nanosec: 6,
    };

    const positions: number[] = [1.1, 2.2, 3.3];

    const jointTrajectoryPoint: jointTrajectoryPoint = {
        positions,
        time_from_start,
    };

    return jointTrajectoryPoint;
}

export function createDummyJointTrajectoryMessage(): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDummyStdMessageHeader(),
        joint_names: ["joint_1", "joint_2", "joint_3"],
        points: [
            createDummyJointTrajectoryPoint(),
            createDummyJointTrajectoryPoint(),
        ],
    };

    return jointTrajectoryMessage;
}
