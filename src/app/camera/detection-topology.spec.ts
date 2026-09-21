import {
    FACEMESH_MODEL_ID,
    modelDrawsSkeleton,
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
