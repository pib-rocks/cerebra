import {MotorPathName} from "./motor-configuration";

export interface JointConfiguration {
    jointPathName: string;
    background: string;
    overlay: string;
    segmentHeight: number;
    segmentOffset: number;
    reversed: boolean;
    motors: {
        motorPathName: string;
        touchPointCenterX: number;
        touchPointCenterY: number;
    }[];
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
            {
                motorPathName: MotorPathName.TILT_FORWARD,
                touchPointCenterX: 0.5739329268292683,
                touchPointCenterY: 0.5887931034482759,
            },
            {
                motorPathName: MotorPathName.TURN_HEAD,
                touchPointCenterX: 0.5884146341463414,
                touchPointCenterY: 0.6836206896551724,
            },
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
            {
                motorPathName: MotorPathName.THUMB_LEFT_STRETCH,
                touchPointCenterX: 0.3978658536585366,
                touchPointCenterY: 0.13793103448275862,
            },
            {
                motorPathName: MotorPathName.THUMB_LEFT_OPPOSITION,
                touchPointCenterX: 0.19588414634146342,
                touchPointCenterY: 0.3905172413793103,
            },
            {
                motorPathName: MotorPathName.INDEX_LEFT_STRETCH,
                touchPointCenterX: 0.756859756097561,
                touchPointCenterY: 0.3456896551724138,
            },
            {
                motorPathName: MotorPathName.MIDDLE_LEFT_STRETCH,
                touchPointCenterX: 0.8224085365853658,
                touchPointCenterY: 0.5293103448275862,
            },
            {
                motorPathName: MotorPathName.RING_LEFT_STRECTH,
                touchPointCenterX: 0.7842987804878049,
                touchPointCenterY: 0.6603448275862069,
            },
            {
                motorPathName: MotorPathName.PINKY_LEFT_STRECTH,
                touchPointCenterX: 0.6875,
                touchPointCenterY: 0.7896551724137931,
            },
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
            {
                motorPathName: MotorPathName.THUMB_RIGHT_STRETCH,
                touchPointCenterX: 0.6051829268292683,
                touchPointCenterY: 0.1413793103448276,
            },
            {
                motorPathName: MotorPathName.THUMB_RIGHT_OPPOSITION,
                touchPointCenterX: 0.8048780487804879,
                touchPointCenterY: 0.3931034482758621,
            },
            {
                motorPathName: MotorPathName.INDEX_RIGHT_STRETCH,
                touchPointCenterX: 0.2423780487804878,
                touchPointCenterY: 0.3482758620689655,
            },
            {
                motorPathName: MotorPathName.MIDDLE_RIGHT_STRETCH,
                touchPointCenterX: 0.20198170731707318,
                touchPointCenterY: 0.531896551724138,
            },
            {
                motorPathName: MotorPathName.RING_RIGHT_STRECTH,
                touchPointCenterX: 0.2530487804878049,
                touchPointCenterY: 0.6629310344827586,
            },
            {
                motorPathName: MotorPathName.PINKY_RIGHT_STRECTH,
                touchPointCenterX: 0.32698170731707316,
                touchPointCenterY: 0.7931034482758621,
            },
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
            {
                motorPathName: MotorPathName.SHOULDER_HORIZONTAL_LEFT,
                touchPointCenterX: 0.12195121951219512,
                touchPointCenterY: 0.15948275862068967,
            },
            {
                motorPathName: MotorPathName.SHOULDER_VERTICAL_LEFT,
                touchPointCenterX: 0.19207317073170732,
                touchPointCenterY: 0.20775862068965517,
            },
            {
                motorPathName: MotorPathName.UPPER_ARM_LEFT_ROTATION,
                touchPointCenterX: 0.22560975609756098,
                touchPointCenterY: 0.4224137931034483,
            },
            {
                motorPathName: MotorPathName.ELBOW_LEFT,
                touchPointCenterX: 0.19969512195121952,
                touchPointCenterY: 0.5551724137931034,
            },
            {
                motorPathName: MotorPathName.LOWER_ARM_LEFT_ROTATION,
                touchPointCenterX: 0.3048780487804878,
                touchPointCenterY: 0.6387931034482759,
            },
            {
                motorPathName: MotorPathName.WRIST_LEFT,
                touchPointCenterX: 0.3780487804878049,
                touchPointCenterY: 0.8181034482758621,
            },
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
            {
                motorPathName: MotorPathName.SHOULDER_HORIZONTAL_RIGHT,
                touchPointCenterX: 0.8917682926829268,
                touchPointCenterY: 0.15948275862068967,
            },
            {
                motorPathName: MotorPathName.SHOULDER_VERTICAL_RIGHT,
                touchPointCenterX: 0.8079268292682927,
                touchPointCenterY: 0.20775862068965517,
            },
            {
                motorPathName: MotorPathName.UPPER_ARM_RIGHT_ROTATION,
                touchPointCenterX: 0.7515243902439024,
                touchPointCenterY: 0.4224137931034483,
            },
            {
                motorPathName: MotorPathName.ELBOW_RIGHT,
                touchPointCenterX: 0.7530487804878049,
                touchPointCenterY: 0.5551724137931034,
            },
            {
                motorPathName: MotorPathName.LOWER_ARM_RIGHT_ROTATION,
                touchPointCenterX: 0.676829268292683,
                touchPointCenterY: 0.6586206896551724,
            },
            {
                motorPathName: MotorPathName.WRIST_RIGHT,
                touchPointCenterX: 0.6577743902439024,
                touchPointCenterY: 0.8181034482758621,
            },
        ],
    },
];

export const jointNameToConfiguration = new Map<string, JointConfiguration>();
for (const joint of joints) {
    jointNameToConfiguration.set(joint.jointPathName, joint);
}
