/**
 * Centidegree ↔ radian conversions for the ROS bridge only.
 * HTTP APIs, persistence, Blockly, and UI stay in integer centidegrees;
 * do not convert joint angles anywhere else in Cerebra.
 */

const CENTIDEGREES_PER_RADIAN = 18000 / Math.PI;

export function centidegToRad(centidegrees: number): number {
    return centidegrees / CENTIDEGREES_PER_RADIAN;
}

export function radToCentideg(radians: number): number {
    return Math.round(radians * CENTIDEGREES_PER_RADIAN);
}
