#!/usr/bin/env node
/**
 * Production-browser acceptance for the hand_tracking_fast overlay.
 *
 * Without --execute-live this process does not open a browser and reports
 * NOT EXECUTED. ROS publication is not evidence that markers were drawn.
 *
 * Live mode opens the deployed camera page, reads data-applied-hand-updates
 * and the rendered keypoint positions, and writes a JSON report. Hold one
 * real hand in view for the whole measurement. A screenshot is not a rate.
 *
 *   PIB_ACCEPTANCE_CEREBRA_URL=https://robot.example/camera \
 *     node scripts/verify-hand-overlay-acceptance.mjs --execute-live
 */

const MIN_SECONDS = 20;
const MIN_RATE_HZ = 10;
const KEYPOINTS = 21;

function remainingSteps() {
    return [
        "Deploy the merged Cerebra build through the normal update path.",
        "Open the production camera page, not a unit-test fixture.",
        "Start hand_tracking_fast and wait until the start response succeeds. A rosbridge timeout is a failed start.",
        "Hold one real hand in view for at least 20 seconds.",
        "Record data-applied-hand-updates at the start and end of that same interval, plus the cx/cy of the 21 detection-keypoint circles.",
        "Require about 10 distinct applied updates per second. Do not count camera frames, repeated redraws, or empty detections.",
        "Move the hand and resize the viewport. Markers stay on the displayed hand. An empty result and model stop clear the circles and connections.",
    ];
}

function parseArgs(argv) {
    return {
        executeLive: argv.includes("--execute-live"),
        url: process.env.PIB_ACCEPTANCE_CEREBRA_URL || "",
        seconds: Number(process.env.PIB_ACCEPTANCE_SECONDS || MIN_SECONDS),
    };
}

async function measure(url, seconds) {
    const {chromium} = await import("playwright");
    const browser = await chromium.launch({headless: true});
    const page = await browser.newPage();
    try {
        await page.goto(url, {waitUntil: "domcontentloaded"});
        const overlay = page.locator(
            'svg.detection-overlay[data-model-id="hand_tracking_fast"]',
        );
        await overlay.waitFor({state: "visible", timeout: 30_000});
        const before = Number(
            await overlay.getAttribute("data-applied-hand-updates"),
        );
        const started = Date.now();
        await page.waitForTimeout(seconds * 1000);
        const after = Number(
            await overlay.getAttribute("data-applied-hand-updates"),
        );
        const positions = await page
            .locator(
                'svg.detection-overlay[data-model-id="hand_tracking_fast"] .detection-keypoint',
            )
            .evaluateAll((nodes) =>
                nodes.map((node) => ({
                    name: node.querySelector("title")?.textContent ?? "",
                    cx: node.getAttribute("cx"),
                    cy: node.getAttribute("cy"),
                })),
            );
        const elapsed = (Date.now() - started) / 1000;
        const updates = after - before;
        return {
            elapsed_seconds: Number(elapsed.toFixed(3)),
            applied_updates: updates,
            applied_rate_hz: Number((updates / elapsed).toFixed(3)),
            rendered_keypoints: positions.length,
            positions,
            meets_rate:
                elapsed >= MIN_SECONDS &&
                updates / elapsed >= MIN_RATE_HZ &&
                positions.length === KEYPOINTS,
        };
    } finally {
        await browser.close();
    }
}

const args = parseArgs(process.argv.slice(2));
const report = {
    live_acceptance: "NOT EXECUTED",
    remaining_post_merge_steps: remainingSteps(),
};

if (!args.executeLive) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
}

if (!args.url) {
    console.error(
        "Set PIB_ACCEPTANCE_CEREBRA_URL to the deployed camera page.",
    );
    process.exit(2);
}

report.live_acceptance = "EXECUTED";
report.measurement = await measure(args.url, args.seconds);
console.log(JSON.stringify(report, null, 2));
process.exit(report.measurement.meets_rate ? 0 : 1);
