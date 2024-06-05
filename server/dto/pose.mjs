import MotorPosition from "./motor-position.mjs";
import GenertateId from "../util/generateId.mjs";

export class Pose {
    constructor(poseId, name, motorPositions = []) {
        this.poseId = poseId;
        this.name = name;
        this.motorPositions = motorPositions;
    }

    static getPose(pose) {
        return new Pose(
            pose.poseId,
            pose.name,
            pose.motorPositions.map((mp) => MotorPosition.getMotorPosition(mp)),
        );
    }

    static newPose(name, motorPositions) {
        return new Pose(GenertateId.genertateId(), name, motorPositions);
    }
}
export default Pose;
