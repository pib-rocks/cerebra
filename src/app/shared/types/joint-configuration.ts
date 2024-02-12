import {
    MotorConfiguration,
    MotorPathName,
    motorPathNameToConfig,
} from "./motor-configuration";

export interface JointConfiguration {
    jointPathName: string;
    background: string;
    overlay: string;
    segmentHeight: number;
    segmentOffset: number;
    reversed: boolean;
    motors: MotorConfiguration[];
}

export enum JointPathName {
    HEAD = "head",
    LEFT_HAND = "left-hand",
    RIGHT_HAND = "right-hand",
    LEFT_ARM = "left-arm",
    RIGHT_ARM = "right-arm",
}

export const joints: JointConfiguration[] = [
    {
        jointPathName: JointPathName.HEAD,
        background: "/joint-control/background/head_background.png",
        overlay: "/joint-control/overlay/head_overlay.png",
        reversed: false,
        segmentHeight: 0.1508620689655172,
        segmentOffset: 0.3646551724137931,
        motors: [
            motorPathNameToConfig.get(MotorPathName.TILT_FORWARD)!,
            motorPathNameToConfig.get(MotorPathName.TURN_HEAD)!,
        ],
    },
    {
        jointPathName: JointPathName.LEFT_HAND,
        background: "/joint-control/background/hand_left_background.png",
        overlay: "/joint-control/overlay/hand_left_overlay.png",
        reversed: true,
        segmentHeight: 0.1303448275862069,
        segmentOffset: 0.1379310344827586,
        motors: [
            motorPathNameToConfig.get(MotorPathName.THUMB_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.THUMB_LEFT_OPPOSITION)!,
            motorPathNameToConfig.get(MotorPathName.INDEX_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.MIDDLE_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.RING_LEFT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.PINKY_LEFT_STRECTH)!,
        ],
    },
    {
        jointPathName: JointPathName.RIGHT_HAND,
        background: "/joint-control/background/hand_right_background.png",
        overlay: "/joint-control/overlay/hand_right_overlay.png",
        reversed: false,
        segmentHeight: 0.1303448275862069,
        segmentOffset: 0.1379310344827586,
        motors: [
            motorPathNameToConfig.get(MotorPathName.THUMB_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.THUMB_RIGHT_OPPOSITION)!,
            motorPathNameToConfig.get(MotorPathName.INDEX_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.MIDDLE_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.RING_RIGHT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.PINKY_RIGHT_STRECTH)!,
        ],
    },
    {
        jointPathName: JointPathName.LEFT_ARM,
        background: "/joint-control/background/arm_left_background.png",
        overlay: "/joint-control/overlay/arm_left_overlay.png",
        reversed: true,
        segmentHeight: 0.1318965517241379,
        segmentOffset: 0.1586206896551724,
        motors: [
            motorPathNameToConfig.get(MotorPathName.SHOULDER_HORIZONTAL_LEFT)!,
            motorPathNameToConfig.get(MotorPathName.SHOULDER_VERTICAL_LEFT)!,
            motorPathNameToConfig.get(MotorPathName.UPPER_ARM_LEFT_ROTATION)!,
            motorPathNameToConfig.get(MotorPathName.ELBOW_LEFT)!,
            motorPathNameToConfig.get(MotorPathName.LOWER_ARM_LEFT_ROTATION)!,
            motorPathNameToConfig.get(MotorPathName.WRIST_LEFT)!,
        ],
    },
    {
        jointPathName: JointPathName.RIGHT_ARM,
        background: "/joint-control/background/arm_right_background.png",
        overlay: "/joint-control/overlay/arm_right_overlay.png",
        reversed: false,
        segmentHeight: 0.1318965517241379,
        segmentOffset: 0.1586206896551724,
        motors: [
            motorPathNameToConfig.get(MotorPathName.SHOULDER_HORIZONTAL_RIGHT)!,
            motorPathNameToConfig.get(MotorPathName.SHOULDER_VERTICAL_RIGHT)!,
            motorPathNameToConfig.get(MotorPathName.UPPER_ARM_RIGHT_ROTATION)!,
            motorPathNameToConfig.get(MotorPathName.ELBOW_RIGHT)!,
            motorPathNameToConfig.get(MotorPathName.LOWER_ARM_RIGHT_ROTATION)!,
            motorPathNameToConfig.get(MotorPathName.WRIST_RIGHT)!,
        ],
    },
];

export const jointPathNameToConfig = new Map<string, JointConfiguration>();
for (const joint of joints) {
    jointPathNameToConfig.set(joint.jointPathName, joint);
}
