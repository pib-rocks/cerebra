import {
    ActivatedRouteSnapshot,
    ResolveFn,
    RouterStateSnapshot,
} from "@angular/router";
import {JointConfiguration} from "../joint-configuration/joint-configuration";

const jointNameToConfiguration: Map<string, JointConfiguration> = new Map();

// TODO: CHECK MOTOR ORDER

jointNameToConfiguration.set("head", {
    image: "/joint-control/images/head.png",
    reversed: false,
    motors: [
        {
            motorName: "tilt_forward_motor",
            relativeTouchpointCenter: {
                x: 0.5739329268292683,
                y: 0.5887931034482758,
            },
            relativeHeight: 0.3646551724137931,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "turn_head_motor",
            relativeTouchpointCenter: {
                x: 0.5884146341463414,
                y: 0.6836206896551724,
            },
            relativeHeight: 0.5120689655172413,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
    ],
});

jointNameToConfiguration.set("left-hand", {
    image: "/joint-control/images/hand_left.png",
    reversed: true,
    motors: [
        {
            motorName: "thumb_right_stretch",
            relativeTouchpointCenter: {
                x: 0.3978658536585366,
                y: 0.13793103448275862,
            },
            relativeHeight: 0.13793103448275862,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "thumb_right_opposition",
            relativeTouchpointCenter: {
                x: 0.19588414634146342,
                y: 0.3905172413793103,
            },
            relativeHeight: 0.2689655172413793,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "index_right_stretch",
            relativeTouchpointCenter: {
                x: 0.756859756097561,
                y: 0.3456896551724138,
            },
            relativeHeight: 0.39827586206896554,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "middle_right_stretch",
            relativeTouchpointCenter: {
                x: 0.8224085365853658,
                y: 0.5293103448275862,
            },
            relativeHeight: 0.5293103448275862,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "ring_right_stretch",
            relativeTouchpointCenter: {
                x: 0.7842987804878049,
                y: 0.6603448275862069,
            },
            relativeHeight: 0.6586206896551724,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "pinky_right_stretch",
            relativeTouchpointCenter: {x: 0.6875, y: 0.7896551724137931},
            relativeHeight: 0.7896551724137931,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
    ],
});

jointNameToConfiguration.set("right-hand", {
    image: "/joint-control/images/hand_right.png",
    reversed: false,
    motors: [
        {
            motorName: "thumb_left_stretch",
            relativeTouchpointCenter: {
                x: 0.6051829268292683,
                y: 0.1413793103448276,
            },
            relativeHeight: 0.14051724137931035,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "thumb_left_opposition",
            relativeTouchpointCenter: {
                x: 0.8048780487804879,
                y: 0.3931034482758621,
            },
            relativeHeight: 0.27241379310344827,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "index_left_stretch",
            relativeTouchpointCenter: {
                x: 0.2423780487804878,
                y: 0.3482758620689655,
            },
            relativeHeight: 0.4025862068965517,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "middle_left_stretch",
            relativeTouchpointCenter: {
                x: 0.20198170731707318,
                y: 0.531896551724138,
            },
            relativeHeight: 0.5336206896551724,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "ring_left_stretch",
            relativeTouchpointCenter: {
                x: 0.2530487804878049,
                y: 0.6629310344827586,
            },
            relativeHeight: 0.6620689655172414,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "pinky_left_stretch",
            relativeTouchpointCenter: {
                x: 0.32698170731707316,
                y: 0.7931034482758621,
            },
            relativeHeight: 0.7931034482758621,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
    ],
});

jointNameToConfiguration.set("left-arm", {
    image: "/joint-control/images/arm_left.png",
    reversed: true,
    motors: [
        {
            motorName: "shoulder_horizontal_left",
            relativeTouchpointCenter: {
                x: 0.12195121951219512,
                y: 0.15948275862068967,
            },
            relativeHeight: 0.15948275862068967,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "shoulder_vertical_left",
            relativeTouchpointCenter: {
                x: 0.19207317073170732,
                y: 0.20775862068965517,
            },
            relativeHeight: 0.29051724137931034,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "upper_arm_left_rotation",
            relativeTouchpointCenter: {
                x: 0.22560975609756098,
                y: 0.4224137931034483,
            },
            relativeHeight: 0.4224137931034483,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "elbow_left",
            relativeTouchpointCenter: {
                x: 0.19969512195121952,
                y: 0.5551724137931034,
            },
            relativeHeight: 0.5551724137931034,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "lower_arm_left_rotation",
            relativeTouchpointCenter: {
                x: 0.3048780487804878,
                y: 0.6387931034482759,
            },
            relativeHeight: 0.6862068965517242,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "wrist_left",
            relativeTouchpointCenter: {
                x: 0.3780487804878049,
                y: 0.8181034482758621,
            },
            relativeHeight: 0.8189655172413793,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
    ],
});

jointNameToConfiguration.set("right-arm", {
    image: "/joint-control/images/arm_right.png",
    reversed: true,
    motors: [
        {
            motorName: "shoulder_horizontal_right",
            relativeTouchpointCenter: {
                x: 0.8917682926829268,
                y: 0.15948275862068967,
            },
            relativeHeight: 0.15948275862068967,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "shoulder_vertical_right",
            relativeTouchpointCenter: {
                x: 0.8079268292682927,
                y: 0.20775862068965517,
            },
            relativeHeight: 0.29051724137931034,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "upper_arm_right_rotation",
            relativeTouchpointCenter: {
                x: 0.7515243902439024,
                y: 0.4224137931034483,
            },
            relativeHeight: 0.4224137931034483,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "elbow_right",
            relativeTouchpointCenter: {
                x: 0.7530487804878049,
                y: 0.5551724137931034,
            },
            relativeHeight: 0.553448275862069,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "lower_arm_right_rotation",
            relativeTouchpointCenter: {
                x: 0.676829268292683,
                y: 0.6586206896551724,
            },
            relativeHeight: 0.6870689655172414,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
        {
            motorName: "wrist_right",
            relativeTouchpointCenter: {
                x: 0.6577743902439024,
                y: 0.8181034482758621,
            },
            relativeHeight: 0.8189655172413793,
            sliderIconLeft: "/joint-control/images/head.png",
            sliderIconRight: "/joint-control/images/head.png",
        },
    ],
});

export const jointResolver: ResolveFn<JointConfiguration> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
): JointConfiguration => {
    const jointName = route.params["joint-name"];
    return jointNameToConfiguration.get(jointName)!;
};
