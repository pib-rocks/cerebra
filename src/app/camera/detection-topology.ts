/**
 * Overlay topology per model (PR-1798).
 *
 * The overlay used to draw the MediaPipe hand skeleton for every model, which
 * turns a face mesh (478 points) into nonsense lines. The topology is now looked
 * up per model id: models that are not listed get no connections at all, which is
 * the right default for box-only detectors and for landmark models whose edges
 * have not been described yet.
 *
 * Adding a model here is the whole change needed for its connections; the table
 * should eventually come from the backend's model definition (PR-1760).
 */

import {
    HAND_KEYPOINT_NAMES,
    HAND_SKELETON_NAME_PAIRS,
    HAND_SKELETON_INDEX_PAIRS,
    SkeletonConnection,
    SkeletonKeypoint,
} from "./hand-skeleton";
import {FACEMESH_INDEX_PAIRS} from "./facemesh-topology";

export const HAND_MODEL_IDS: ReadonlyArray<string> = [
    "hand_tracking",
    "hand_tracking_mp",
    "imitation",
];
export const FACEMESH_MODEL_ID = "facemesh_crop";
export const FACIAL_LANDMARKS_68_MODEL_ID = "facial_landmarks_68_crop";
export const HEAD_POSE_MODEL_ID = "head_pose_estimation_crop";
export const QR_CODE_MODEL_ID = "qr_code_detection_384x384";
export const QR_CODE_INDEX_PAIRS: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
];

/** Five canonical contour groups: jaw, brows, nose, eyes, and lips. */
export const FACIAL_LANDMARKS_68_CONTOURS: ReadonlyArray<
    ReadonlyArray<ReadonlyArray<number>>
> = [
    [Array.from({length: 17}, (_, index) => index)],
    [
        [17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26],
    ],
    [
        [27, 28, 29, 30],
        [31, 32, 33, 34, 35],
    ],
    [
        [36, 37, 38, 39, 40, 41, 36],
        [42, 43, 44, 45, 46, 47, 42],
    ],
    [
        [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
        [60, 61, 62, 63, 64, 65, 66, 67, 60],
    ],
];

export const FACIAL_LANDMARKS_68_INDEX_PAIRS: ReadonlyArray<
    readonly [number, number]
> = FACIAL_LANDMARKS_68_CONTOURS.flatMap((contour) =>
    contour.flatMap((path) =>
        path.slice(1).map((point, index) => [path[index], point] as const),
    ),
);

/** Models whose overlay draws a skeleton instead of a bounding box. */
export function modelDrawsSkeleton(modelId: string): boolean {
    return (
        HAND_MODEL_IDS.includes(modelId) ||
        modelId === FACEMESH_MODEL_ID ||
        modelId === FACIAL_LANDMARKS_68_MODEL_ID
    );
}

function segment(
    from: SkeletonKeypoint | undefined,
    to: SkeletonKeypoint | undefined,
): SkeletonConnection | undefined {
    if (!from || !to) return undefined;
    if (
        !Number.isFinite(from.x) ||
        !Number.isFinite(from.y) ||
        !Number.isFinite(to.x) ||
        !Number.isFinite(to.y)
    ) {
        return undefined;
    }
    return {x1: from.x, y1: from.y, x2: to.x, y2: to.y};
}

function byNamePairs(
    keypoints: ReadonlyArray<SkeletonKeypoint>,
    pairs: ReadonlyArray<readonly [string, string]>,
): SkeletonConnection[] | undefined {
    const byName = new Map<string, SkeletonKeypoint>();
    for (const keypoint of keypoints) {
        byName.set(keypoint.name, keypoint);
    }
    const connections: SkeletonConnection[] = [];
    for (const [fromName, toName] of pairs) {
        const connection = segment(byName.get(fromName), byName.get(toName));
        if (connection) connections.push(connection);
    }
    return connections.length > 0 ? connections : undefined;
}

function byIndexPairs(
    keypoints: ReadonlyArray<SkeletonKeypoint>,
    pairs: ReadonlyArray<readonly [number, number]>,
    minimumPoints: number,
): SkeletonConnection[] {
    if (keypoints.length < minimumPoints) return [];
    const connections: SkeletonConnection[] = [];
    for (const [fromIndex, toIndex] of pairs) {
        const connection = segment(keypoints[fromIndex], keypoints[toIndex]);
        if (connection) connections.push(connection);
    }
    return connections;
}

/**
 * Connections for one detection of one model.
 *
 * Models without a registered topology return an empty list, so their keypoints
 * are drawn as dots only.
 */
export function topologyConnections(
    modelId: string,
    keypoints: ReadonlyArray<SkeletonKeypoint>,
): SkeletonConnection[] {
    if (modelId === QR_CODE_MODEL_ID) {
        return byIndexPairs(keypoints, QR_CODE_INDEX_PAIRS, 4);
    }
    if (!modelDrawsSkeleton(modelId)) return [];
    if (modelId === FACEMESH_MODEL_ID) {
        return byIndexPairs(keypoints, FACEMESH_INDEX_PAIRS, 468);
    }
    if (modelId === FACIAL_LANDMARKS_68_MODEL_ID) {
        return byIndexPairs(keypoints, FACIAL_LANDMARKS_68_INDEX_PAIRS, 68);
    }
    const byName = byNamePairs(keypoints, HAND_SKELETON_NAME_PAIRS);
    if (byName) return byName;
    return byIndexPairs(
        keypoints,
        HAND_SKELETON_INDEX_PAIRS,
        HAND_KEYPOINT_NAMES.length,
    );
}
