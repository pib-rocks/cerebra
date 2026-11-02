/**
 * MediaPipe hand skeleton keyed by landmark names (option A for PR-1779).
 * This table should move to the model definition later (option B / PR-1760).
 */

export const HAND_KEYPOINT_NAMES = [
    "wrist",
    "thumb_cmc",
    "thumb_mcp",
    "thumb_ip",
    "thumb_tip",
    "index_finger_mcp",
    "index_finger_pip",
    "index_finger_dip",
    "index_finger_tip",
    "middle_finger_mcp",
    "middle_finger_pip",
    "middle_finger_dip",
    "middle_finger_tip",
    "ring_finger_mcp",
    "ring_finger_pip",
    "ring_finger_dip",
    "ring_finger_tip",
    "pinky_mcp",
    "pinky_pip",
    "pinky_dip",
    "pinky_tip",
] as const;

export const HAND_SKELETON_INDEX_PAIRS: ReadonlyArray<
    readonly [number, number]
> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20],
    [0, 17],
];

export const HAND_SKELETON_NAME_PAIRS: ReadonlyArray<
    readonly [string, string]
> = HAND_SKELETON_INDEX_PAIRS.map(([from, to]) => [
    HAND_KEYPOINT_NAMES[from],
    HAND_KEYPOINT_NAMES[to],
]);

const HAND_KEYPOINT_NAME_SET = new Set<string>(HAND_KEYPOINT_NAMES);

export interface SkeletonKeypoint {
    name: string;
    x: number;
    y: number;
}

export interface SkeletonConnection {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
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

function connectionsFromPairs(
    keypoints: ReadonlyArray<SkeletonKeypoint>,
    pairs: ReadonlyArray<readonly [number, number]>,
): SkeletonConnection[] {
    const connections: SkeletonConnection[] = [];
    for (const [fromIndex, toIndex] of pairs) {
        const connection = segment(keypoints[fromIndex], keypoints[toIndex]);
        if (connection) connections.push(connection);
    }
    return connections;
}

/**
 * Resolve MediaPipe hand edges for overlay keypoints.
 * Prefers matching `keypoint_names`; unknown or missing names fall back to
 * the index pairs. Detections with fewer points than the skeleton yield [].
 */
export function handSkeletonConnections(
    keypoints: ReadonlyArray<SkeletonKeypoint>,
): SkeletonConnection[] {
    const knownByName = new Map<string, SkeletonKeypoint>();
    for (const keypoint of keypoints) {
        if (HAND_KEYPOINT_NAME_SET.has(keypoint.name)) {
            knownByName.set(keypoint.name, keypoint);
        }
    }

    if (knownByName.size > 0) {
        const connections: SkeletonConnection[] = [];
        for (const [fromName, toName] of HAND_SKELETON_NAME_PAIRS) {
            const connection = segment(
                knownByName.get(fromName),
                knownByName.get(toName),
            );
            if (connection) connections.push(connection);
        }
        return connections;
    }

    if (keypoints.length < HAND_KEYPOINT_NAMES.length) {
        return [];
    }

    return connectionsFromPairs(keypoints, HAND_SKELETON_INDEX_PAIRS);
}
