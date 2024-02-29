import {
    MotorConfiguration,
    MotorPathName,
    motorPathNameToConfig,
} from "./motor-configuration";

export interface JointConfiguration {
    jointPathName: string;
    label: string;
    background: string;
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
        label: "Head",
        background: "/joint-control/background/head_background.png",
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
        label: "Left Hand",
        background: "/joint-control/background/hand_left_background.png",
        reversed: true,
        segmentHeight: 0.1301724137931034,
        segmentOffset: 0.1637931034482759,
        motors: [
            motorPathNameToConfig.get(MotorPathName.THUMB_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.THUMB_LEFT_OPPOSITION)!,
            motorPathNameToConfig.get(MotorPathName.INDEX_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.MIDDLE_LEFT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.RING_LEFT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.PINKY_LEFT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.ALL_FINGERS_LEFT)!,
        ],
    },
    {
        jointPathName: JointPathName.RIGHT_HAND,
        label: "Right Hand",
        background: "/joint-control/background/hand_right_background.png",
        reversed: false,
        segmentHeight: 0.1301724137931034,
        segmentOffset: 0.1637931034482759,
        motors: [
            motorPathNameToConfig.get(MotorPathName.THUMB_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.THUMB_RIGHT_OPPOSITION)!,
            motorPathNameToConfig.get(MotorPathName.INDEX_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.MIDDLE_RIGHT_STRETCH)!,
            motorPathNameToConfig.get(MotorPathName.RING_RIGHT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.PINKY_RIGHT_STRECTH)!,
            motorPathNameToConfig.get(MotorPathName.ALL_FINGERS_RIGHT)!,
        ],
    },
    {
        jointPathName: JointPathName.LEFT_ARM,
        label: "Left Arm",
        background: "/joint-control/background/arm_left_background.png",
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
        label: "Right Arm",
        background: "/joint-control/background/arm_right_background.png",
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
