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
        seq: 3,
        stamp,
        frame_id: "4",
    };

    return stdMessageHeader;
}

export function createDummyJointTrajectoryPoint(): jointTrajectoryPoint {
    const time_from_start: rosTime = {
        sec: 5,
        nanosec: 6,
    };

    const positions: Float64Array = new Float64Array([7.0]);

    const jointTrajectoryPoint: jointTrajectoryPoint = {
        positions,
        time_from_start,
    };

    return jointTrajectoryPoint;
}

export function createDummyJointTrajectoryMessage(): jointTrajectoryMessage {
    const jointTrajectoryMessage: jointTrajectoryMessage = {
        header: createDummyStdMessageHeader(),
        joint_names: ["8"],
        points: [
            createDummyJointTrajectoryPoint(),
            createDummyJointTrajectoryPoint(),
        ],
    };

    return jointTrajectoryMessage;
}
