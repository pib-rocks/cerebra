/** Formats integer centidegrees for human-facing joint-angle labels. */
export function formatCentidegrees(centidegrees: number): string {
    const tenths = Math.round(centidegrees / 10);
    return `${(tenths / 10).toFixed(1)} °`;
}
