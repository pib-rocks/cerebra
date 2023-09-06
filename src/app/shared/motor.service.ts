import {Injectable} from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    leftFingers = [
        "all_left_stretch",
        "thumb_left_stretch",
        "index_left_stretch",
        "middle_left_stretch",
        "ring_left_stretch",
        "pinky_left_stretch",
    ];

    rightFingers = [
        "all_right_stretch",
        "thumb_right_stretch",
        "index_right_stretch",
        "middle_right_stretch",
        "ring_right_stretch",
        "pinky_right_stretch",
    ];

    leftArm = [
        "upper_arm_left_rotation",
        "elbow_left",
        "lower_arm_left_rotation",
        "wrist_left",
    ];

    rightArm = [
        "upper_arm_right_rotation",
        "elbow_right",
        "lower_arm_right_rotation",
        "wrist_right",
    ];

    getMotorHandNames(side: string) {
        return side === "left" ? this.leftFingers : this.rightFingers;
    }

    getMotorArmNames(side: string) {
        return side === "left" ? this.leftArm : this.rightArm;
    }
}
