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

export const HAND_MODEL_IDS: ReadonlyArray<string> = [
    "hand_tracking",
    "hand_tracking_mp",
    "imitation",
];

/** Models whose overlay draws a skeleton instead of a bounding box. */
export function modelDrawsSkeleton(modelId: string): boolean {
    return HAND_MODEL_IDS.includes(modelId);
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
    if (!modelDrawsSkeleton(modelId)) return [];
    const byName = byNamePairs(keypoints, HAND_SKELETON_NAME_PAIRS);
    if (byName) return byName;
    return byIndexPairs(
        keypoints,
        HAND_SKELETON_INDEX_PAIRS,
        HAND_KEYPOINT_NAMES.length,
    );
}
