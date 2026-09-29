import {
    boxRule,
    HAND_MODEL_IDS,
    labelScalars,
    FACIAL_LANDMARKS_68_CONTOURS,
    FACIAL_LANDMARKS_68_INDEX_PAIRS,
    FACIAL_LANDMARKS_68_MODEL_ID,
    FACEMESH_MODEL_ID,
    modelDrawsSkeleton,
    QR_CODE_INDEX_PAIRS,
    QR_CODE_MODEL_ID,
    topologyConnections,
} from "./detection-topology";
import {FACEMESH_INDEX_PAIRS} from "./facemesh-topology";

describe("facemesh topology", () => {
    it("contains only unique edges within the 468-landmark model", () => {
        const edges = FACEMESH_INDEX_PAIRS.map(([first, second]) =>
            [first, second].sort((left, right) => left - right).join("-"),
        );

        expect(FACEMESH_INDEX_PAIRS.length).toBe(1322);
        expect(new Set(edges).size).toBe(edges.length);
        expect(
            FACEMESH_INDEX_PAIRS.every(
                ([first, second]) =>
                    first >= 0 && second >= 0 && first < 468 && second < 468,
            ),
        ).toBeTrue();
    });

    it("draws every mesh edge only when all landmarks are present", () => {
        const keypoints = Array.from({length: 468}, (_, index) => ({
            name: `landmark_${index}`,
            x: index,
            y: index + 1,
        }));

        expect(modelDrawsSkeleton(FACEMESH_MODEL_ID)).toBeTrue();
        expect(topologyConnections(FACEMESH_MODEL_ID, keypoints).length).toBe(
            FACEMESH_INDEX_PAIRS.length,
        );
        expect(
            topologyConnections(FACEMESH_MODEL_ID, keypoints.slice(0, 467)),
        ).toEqual([]);
    });
});

describe("68-point facial-landmark topology", () => {
    it("defines five contour groups with canonical open and closed paths", () => {
        expect(FACIAL_LANDMARKS_68_CONTOURS.length).toBe(5);
        expect(FACIAL_LANDMARKS_68_INDEX_PAIRS.length).toBe(63);
        const hasPair = (from: number, to: number) =>
            FACIAL_LANDMARKS_68_INDEX_PAIRS.some(
                ([first, second]) => first === from && second === to,
            );
        expect(hasPair(0, 1)).toBeTrue();
        expect(hasPair(16, 0)).toBeFalse();
        expect(hasPair(41, 36)).toBeTrue();
        expect(hasPair(67, 60)).toBeTrue();
    });

    it("draws all contours only when all 68 landmarks are present", () => {
        const keypoints = Array.from({length: 68}, (_, index) => ({
            name: `landmark_${index}`,
            x: index,
            y: index + 1,
        }));

        expect(modelDrawsSkeleton(FACIAL_LANDMARKS_68_MODEL_ID)).toBeTrue();
        expect(
            topologyConnections(FACIAL_LANDMARKS_68_MODEL_ID, keypoints).length,
        ).toBe(FACIAL_LANDMARKS_68_INDEX_PAIRS.length);
        expect(
            topologyConnections(
                FACIAL_LANDMARKS_68_MODEL_ID,
                keypoints.slice(0, 67),
            ),
        ).toEqual([]);
    });
});

describe("QR-code topology", () => {
    it("closes the four detector-box corners without hiding the box", () => {
        const keypoints = [
            {name: "top_left", x: 10, y: 20},
            {name: "top_right", x: 30, y: 20},
            {name: "bottom_right", x: 30, y: 40},
            {name: "bottom_left", x: 10, y: 40},
        ];

        expect(QR_CODE_INDEX_PAIRS).toEqual([
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
        ]);
        expect(modelDrawsSkeleton(QR_CODE_MODEL_ID)).toBeFalse();
        expect(topologyConnections(QR_CODE_MODEL_ID, keypoints)).toEqual([
            {x1: 10, y1: 20, x2: 30, y2: 20},
            {x1: 30, y1: 20, x2: 30, y2: 40},
            {x1: 30, y1: 40, x2: 10, y2: 40},
            {x1: 10, y1: 40, x2: 10, y2: 20},
        ]);
        expect(
            topologyConnections(QR_CODE_MODEL_ID, keypoints.slice(0, 3)),
        ).toEqual([]);
    });
});

describe("overlay box rule", () => {
    it("names the models that drop their box", () => {
        for (const modelId of HAND_MODEL_IDS) {
            expect(boxRule(modelId)).withContext(modelId).toBe("skeleton");
        }
        expect(boxRule(FACEMESH_MODEL_ID)).toBe("skeleton");
        expect(boxRule(FACIAL_LANDMARKS_68_MODEL_ID)).toBe("none");
    });

    it("keeps the box for every other model, topology or not", () => {
        expect(boxRule(QR_CODE_MODEL_ID)).toBe("box");
        expect(boxRule("face_detection_yunet_160x120")).toBe("box");
        expect(boxRule("some_future_skeleton_model")).toBe("box");
    });
});

describe("overlay label scalars", () => {
    it("promotes palm_score and z_source for the hand chain only", () => {
        for (const modelId of HAND_MODEL_IDS) {
            expect(labelScalars(modelId).map((scalar) => scalar.name))
                .withContext(modelId)
                .toEqual(["palm_score", "z_source"]);
        }
        expect(labelScalars(QR_CODE_MODEL_ID)).toEqual([]);
        expect(labelScalars("head_pose_estimation_crop")).toEqual([]);
    });
});
