#!/usr/bin/env node
/**
 * Production-browser acceptance for the hand_tracking_fast overlay.
 *
 * Without --execute-live this process does not open a browser and reports
 * NOT EXECUTED. ROS publication is not evidence that markers were drawn.
 * --self-check exercises the reducer on fixtures and is not a live rate.
 *
 * Live mode samples the deployed camera page for the whole interval. Each
 * sample is one source sequence/stamp with the circle and connection elements
 * actually in the DOM. A stationary hand still counts when the sequence
 * changes. A start/end counter does not.
 *
 *   PIB_ACCEPTANCE_CEREBRA_URL=https://robot.example/camera \
 *     node scripts/verify-hand-overlay-acceptance.mjs --execute-live
 */

const MIN_SECONDS = 20;
const MIN_RATE_HZ = 10;
const STARTUP_MS = 1000;
const REQUIRED_CIRCLES = 21;
const REQUIRED_CONNECTIONS = 21;
const MAX_SAMPLES = 600;

function remainingSteps() {
    return [
        "Deploy the merged Cerebra build through the normal update path.",
        "Open the production camera page, not a unit-test fixture.",
        "Start hand_tracking_fast and wait until the start response succeeds. A rosbridge timeout is a failed start.",
        "Hold one real hand in view for at least 20 seconds.",
        "Throughout that interval, record each distinct data-source-sequence and data-source-stamp together with the detection-keypoint cx/cy values and the detection-connection endpoints.",
        "Count circle and connection elements in the DOM. Do not read a rendered-keypoint attribute as the circle count.",
        "Require about 10 distinct applied updates per second after the first second. Identical coordinates are a stationary hand, not a stale frame. A counter that moves while the sequence does not is not a pass.",
        "Move the hand and resize the viewport. Markers and connecting lines stay on the displayed hand. An empty result and model stop clear the circles and the lines.",
    ];
}

function parseArgs(argv) {
    return {
        executeLive: argv.includes("--execute-live"),
        selfCheck: argv.includes("--self-check"),
        url: process.env.PIB_ACCEPTANCE_CEREBRA_URL || "",
        seconds: Number(process.env.PIB_ACCEPTANCE_SECONDS || MIN_SECONDS),
    };
}

function finiteAttribute(value) {
    return value !== null && value !== "" && Number.isFinite(Number(value));
}

function samePose(left, right) {
    if (left.keypoints.length !== right.keypoints.length) return false;
    return left.keypoints.every(
        (point, index) =>
            point.cx === right.keypoints[index].cx &&
            point.cy === right.keypoints[index].cy,
    );
}

/**
 * Reduce probe observations. Rate uses distinct source identities after
 * startup. Pose changes are reported separately and are not required.
 */
export function summarizeHandOverlaySamples(probe, elapsedSeconds) {
    const exclusions = {
        startup_sequences: [],
        redraws: probe.redraws ?? 0,
        missing_overlay: probe.missingOverlay ?? 0,
        missing_identity: probe.missingIdentity ?? 0,
        empty_or_lineless_sequences: [],
        geometry: [],
        counter_mismatch: [],
        dropped: probe.dropped ?? 0,
    };
    const startedAt = probe.startedAt ?? 0;
    const counted = [];
    for (const sample of probe.samples ?? []) {
        const age = sample.t - startedAt;
        if (age < STARTUP_MS) {
            exclusions.startup_sequences.push(sample.sequence);
            continue;
        }
        if (!sample.sequence || !sample.stamp) {
            exclusions.missing_identity += 1;
            continue;
        }
        const circles = sample.keypoints?.length ?? 0;
        const connections = sample.connections?.length ?? 0;
        if (circles === 0 || connections === 0) {
            exclusions.empty_or_lineless_sequences.push(sample.sequence);
            continue;
        }
        const pointsFinite = sample.keypoints.every(
            (point) => finiteAttribute(point.cx) && finiteAttribute(point.cy),
        );
        const linesFinite = sample.connections.every(
            (line) =>
                finiteAttribute(line.x1) &&
                finiteAttribute(line.y1) &&
                finiteAttribute(line.x2) &&
                finiteAttribute(line.y2),
        );
        const instrumented = sample.instrumentedKeypoints;
        if (
            instrumented !== undefined &&
            instrumented !== null &&
            Number(instrumented) !== circles
        ) {
            exclusions.counter_mismatch.push({
                sequence: sample.sequence,
                attribute: Number(instrumented),
                circles,
            });
            continue;
        }
        if (
            !pointsFinite ||
            !linesFinite ||
            circles !== REQUIRED_CIRCLES ||
            connections !== REQUIRED_CONNECTIONS
        ) {
            exclusions.geometry.push({
                sequence: sample.sequence,
                circles,
                connections,
            });
            continue;
        }
        counted.push(sample);
    }

    let stationaryUpdates = 0;
    let movementUpdates = 0;
    for (let index = 1; index < counted.length; index += 1) {
        if (samePose(counted[index - 1], counted[index]))
            stationaryUpdates += 1;
        else movementUpdates += 1;
    }

    const rateWindowSeconds = Math.max(0, elapsedSeconds - STARTUP_MS / 1000);
    const distinctUpdates = counted.length;
    const wallRate =
        rateWindowSeconds > 0 ? distinctUpdates / rateWindowSeconds : 0;
    const spanSeconds =
        counted.length >= 2
            ? (counted[counted.length - 1].t - counted[0].t) / 1000
            : 0;
    const interUpdateRate =
        spanSeconds > 0 ? (counted.length - 1) / spanSeconds : 0;
    const circleCounts = counted.map((sample) => sample.keypoints.length);
    const connectionCounts = counted.map((sample) => sample.connections.length);
    const geometryRejected =
        exclusions.geometry.length +
        exclusions.empty_or_lineless_sequences.length +
        exclusions.counter_mismatch.length;
    const meetsRate =
        elapsedSeconds >= MIN_SECONDS &&
        rateWindowSeconds >= MIN_SECONDS - STARTUP_MS / 1000 &&
        wallRate >= MIN_RATE_HZ &&
        interUpdateRate >= MIN_RATE_HZ &&
        geometryRejected === 0 &&
        exclusions.dropped === 0 &&
        exclusions.missing_identity === 0 &&
        counted.length >= 2;

    return {
        elapsed_seconds: Number(elapsedSeconds.toFixed(3)),
        startup_excluded_seconds: STARTUP_MS / 1000,
        distinct_applied_updates: distinctUpdates,
        distinct_rate_hz: Number(wallRate.toFixed(3)),
        inter_update_rate_hz: Number(interUpdateRate.toFixed(3)),
        movement_updates: movementUpdates,
        stationary_updates: stationaryUpdates,
        rendered_keypoints: {
            min: circleCounts.length ? Math.min(...circleCounts) : 0,
            max: circleCounts.length ? Math.max(...circleCounts) : 0,
        },
        rendered_connections: {
            min: connectionCounts.length ? Math.min(...connectionCounts) : 0,
            max: connectionCounts.length ? Math.max(...connectionCounts) : 0,
        },
        frames_observed: probe.frames ?? 0,
        exclusions,
        meets_rate: meetsRate,
        samples: probe.samples ?? [],
    };
}

function installProbe({modelId, maxSamples}) {
    const overlaySelector = `svg.detection-overlay[data-model-id="${modelId}"]`;
    const state = {
        startedAt: performance.now(),
        frames: 0,
        redraws: 0,
        missingOverlay: 0,
        missingIdentity: 0,
        dropped: 0,
        samples: [],
        lastSequence: null,
    };

    function readOverlay() {
        const overlay = document.querySelector(overlaySelector);
        if (!overlay) return null;
        const circles = [...overlay.querySelectorAll(".detection-keypoint")];
        const lines = [...overlay.querySelectorAll(".detection-connection")];
        return {
            t: performance.now(),
            sequence: overlay.getAttribute("data-source-sequence"),
            stamp: overlay.getAttribute("data-source-stamp"),
            appliedHandUpdates: overlay.getAttribute(
                "data-applied-hand-updates",
            ),
            instrumentedKeypoints: overlay.getAttribute(
                "data-rendered-hand-keypoints",
            ),
            keypoints: circles.map((node) => ({
                name: node.querySelector("title")?.textContent ?? "",
                cx: node.getAttribute("cx"),
                cy: node.getAttribute("cy"),
            })),
            connections: lines.map((node) => ({
                x1: node.getAttribute("x1"),
                y1: node.getAttribute("y1"),
                x2: node.getAttribute("x2"),
                y2: node.getAttribute("y2"),
            })),
        };
    }

    function observe() {
        const reading = readOverlay();
        if (!reading) {
            state.missingOverlay += 1;
            return;
        }
        if (!reading.sequence || !reading.stamp) {
            state.missingIdentity += 1;
            return;
        }
        if (reading.sequence === state.lastSequence) {
            state.redraws += 1;
            return;
        }
        state.lastSequence = reading.sequence;
        if (state.samples.length >= maxSamples) {
            state.dropped += 1;
            return;
        }
        state.samples.push(reading);
    }

    const root = document.querySelector(".camera-image") ?? document.body;
    const observer = new MutationObserver(() => observe());
    observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
    });
    const frame = () => {
        state.frames += 1;
        observe();
        state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
    window.__handOverlayProbe = {state, observer};
}

function collectProbe() {
    const probe = window.__handOverlayProbe;
    if (!probe) {
        return {
            startedAt: 0,
            frames: 0,
            redraws: 0,
            missingOverlay: 0,
            missingIdentity: 0,
            dropped: 0,
            samples: [],
        };
    }
    cancelAnimationFrame(probe.state.raf);
    probe.observer.disconnect();
    const {state} = probe;
    return {
        startedAt: state.startedAt,
        frames: state.frames,
        redraws: state.redraws,
        missingOverlay: state.missingOverlay,
        missingIdentity: state.missingIdentity,
        dropped: state.dropped,
        samples: state.samples,
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
        await page.evaluate(installProbe, {
            modelId: "hand_tracking_fast",
            maxSamples: MAX_SAMPLES,
        });
        const started = Date.now();
        await page.waitForTimeout(seconds * 1000);
        const probe = await page.evaluate(collectProbe);
        const elapsed = (Date.now() - started) / 1000;
        return summarizeHandOverlaySamples(probe, elapsed);
    } finally {
        await browser.close();
    }
}

function poseSample(
    sequence,
    t,
    cx,
    circles = REQUIRED_CIRCLES,
    connections = REQUIRED_CONNECTIONS,
) {
    return {
        t,
        sequence: String(sequence),
        stamp: String(10_000 + sequence),
        appliedHandUpdates: String(sequence),
        instrumentedKeypoints: String(circles),
        keypoints: Array.from({length: circles}, (_, index) => ({
            name: `p${index}`,
            cx: String(cx + index),
            cy: String(100 + index),
        })),
        connections: Array.from({length: connections}, (_, index) => ({
            x1: String(index),
            y1: "0",
            x2: String(index + 1),
            y2: "1",
        })),
    };
}

function steadySamples(cxForIndex) {
    const period = 1000 / 10.2;
    const samples = [];
    for (let index = 0; index < 204; index += 1) {
        samples.push(poseSample(index + 1, index * period, cxForIndex(index)));
    }
    return {
        startedAt: 0,
        frames: 204,
        redraws: 40,
        missingOverlay: 0,
        missingIdentity: 0,
        dropped: 0,
        samples,
    };
}

function selfCheck() {
    const stationary = summarizeHandOverlaySamples(
        steadySamples(() => 10),
        MIN_SECONDS,
    );
    const moving = summarizeHandOverlaySamples(
        steadySamples((index) => index),
        MIN_SECONDS,
    );
    const counterOnly = summarizeHandOverlaySamples(
        {
            startedAt: 0,
            frames: 1,
            redraws: 0,
            missingOverlay: 0,
            missingIdentity: 0,
            dropped: 0,
            samples: [
                {
                    ...poseSample(1, 1500, 10),
                    appliedHandUpdates: "200",
                },
            ],
        },
        MIN_SECONDS,
    );
    const shortHand = summarizeHandOverlaySamples(
        {
            startedAt: 0,
            frames: 1,
            redraws: 0,
            missingOverlay: 0,
            missingIdentity: 0,
            dropped: 0,
            samples: [poseSample(1, 1500, 10, 5, REQUIRED_CONNECTIONS)],
        },
        MIN_SECONDS,
    );
    const dotsOnly = summarizeHandOverlaySamples(
        {
            startedAt: 0,
            frames: 1,
            redraws: 0,
            missingOverlay: 0,
            missingIdentity: 0,
            dropped: 0,
            samples: [poseSample(1, 1500, 10, REQUIRED_CIRCLES, 0)],
        },
        MIN_SECONDS,
    );
    const staleCounter = poseSample(1, 1500, 10);
    staleCounter.instrumentedKeypoints = "21";
    staleCounter.keypoints = staleCounter.keypoints.slice(0, 5);
    const mismatched = summarizeHandOverlaySamples(
        {
            startedAt: 0,
            frames: 1,
            redraws: 0,
            missingOverlay: 0,
            missingIdentity: 0,
            dropped: 0,
            samples: [staleCounter],
        },
        MIN_SECONDS,
    );
    const failures = [];
    if (!stationary.meets_rate) failures.push("stationary fixture should pass");
    if (stationary.movement_updates !== 0) {
        failures.push("stationary fixture reported movement");
    }
    if (stationary.stationary_updates === 0) {
        failures.push("stationary fixture recorded no repeated pose");
    }
    if (!moving.meets_rate) failures.push("moving fixture should pass");
    if (moving.movement_updates === 0) {
        failures.push("moving fixture reported no movement");
    }
    if (counterOnly.meets_rate) {
        failures.push("a single sequence must not pass on a counter delta");
    }
    if (shortHand.meets_rate || shortHand.exclusions.geometry.length === 0) {
        failures.push("a short DOM circle list must fail geometry");
    }
    if (
        dotsOnly.meets_rate ||
        dotsOnly.exclusions.empty_or_lineless_sequences.length === 0
    ) {
        failures.push("circles without connections must not pass");
    }
    if (
        mismatched.meets_rate ||
        mismatched.exclusions.counter_mismatch.length === 0
    ) {
        failures.push(
            "an attribute of 21 must not hide a shorter DOM circle list",
        );
    }
    return {passed: failures.length === 0, failures};
}

const args = parseArgs(process.argv.slice(2));

if (args.selfCheck) {
    const check = selfCheck();
    console.log(
        JSON.stringify(
            {
                self_check: check.passed ? "PASSED" : "FAILED",
                live_acceptance: "NOT EXECUTED",
                note: "Reducer fixtures only. These rates are not a browser or robot measurement.",
                failures: check.failures,
            },
            null,
            2,
        ),
    );
    process.exit(check.passed ? 0 : 1);
}

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
report.measurement = await measure(
    args.url,
    Math.max(args.seconds, MIN_SECONDS),
);
console.log(JSON.stringify(report, null, 2));
process.exit(report.measurement.meets_rate ? 0 : 1);
