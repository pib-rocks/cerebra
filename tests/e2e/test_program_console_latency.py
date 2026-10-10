"""Browser E2E check that the Blockly console renders a run immediately (PR-1976).

Cerebra uses zoneless change detection. When the console and the Run/Stop
button did not notify Angular about program state and output arriving over the
rosbridge WebSocket, a finished program kept showing
"Starting execution of program..." until the user clicked somewhere. This test
runs a disposable print-only program once, never interacts with the page after
clicking Run, and requires every console and Run/Stop update to reach the DOM
within MAX_RENDER_DELAY_MS of the WebSocket frame that caused it.

The test executes a program on the robot, so it needs two explicit opt-ins:
    10|
    PIB_ROBOT_URL=http://<host> PIB_E2E_RUN_PRINT_PROGRAM=1 \\
        python -m pytest tests/e2e/test_program_console_latency.py

Safety: the program is created by this test, holds a single ``text_print`` block
with a fixed text and nothing else, and is verified by API readback before Run.
The editor saves the workspace when Run is clicked; that request is intercepted
and aborted unless it is still exactly that print-only program, so the robot can
only ever compile the verified code. No motor, camera or other block is used.
The program is deleted afterwards and its deletion is verified by readback.
    20|"""

import json
import os
import uuid

import pytest

playwright_sync = pytest.importorskip("playwright.sync_api")

BASE_URL = os.environ.get("PIB_ROBOT_URL", "").rstrip("/")
RUN_ALLOWED = os.environ.get("PIB_E2E_RUN_PRINT_PROGRAM") == "1"

pytestmark = [
    pytest.mark.skipif(
        not BASE_URL, reason="set PIB_ROBOT_URL to run program console E2E tests"
    ),
    pytest.mark.skipif(
        not RUN_ALLOWED,
        reason="set PIB_E2E_RUN_PRINT_PROGRAM=1 to allow running a print-only program",
    ),
]

MAX_RENDER_DELAY_MS = 500
RESULT_TIMEOUT_MS = 30000
# How long the page may stay stale after the result before the test gives up;
# far beyond MAX_RENDER_DELAY_MS so a stuck console is measured, not guessed.
STALE_OBSERVATION_MS = 10000

FINISHED_TEXT = "Program has finished successfully (exit code: 0)"
RUNNING_TEXT = "Program is now executing"
PLAY_ICON = "button-run-play.svg"
STOP_ICON = "button-run-stop.svg"

# Records, on the page's own clock, when run-program frames arrive on the
# rosbridge socket (before the app's onmessage handler runs) and when the
# console and the Run/Stop icon first show each state.
RECORDER_JS = """
(() => {
    const record = {sent: [], frames: [], dom: {}};
    window.__consoleLatency = record;

    const NativeWebSocket = window.WebSocket;
    class RecordingWebSocket extends NativeWebSocket {
        constructor(...args) {
            super(...args);
            this.addEventListener("message", (event) => {
                const at = performance.now();
                if (typeof event.data !== "string") return;
                if (!event.data.includes("proxy_run_program")) return;
                try {
                    record.frames.push({at, frame: JSON.parse(event.data)});
                } catch (error) {}
            });
        }
        send(data) {
            if (typeof data === "string" && data.includes("proxy_run_program")) {
                try {
                    record.sent.push(JSON.parse(data));
                } catch (error) {}
            }
            return super.send(data);
        }
    }
    window.WebSocket = RecordingWebSocket;

    const mark = (name) => {
        if (record.dom[name] === undefined) record.dom[name] = performance.now();
    };
    const inspect = () => {
        if (record.runClickedAt === undefined) return;
        const area = document.getElementById("console-area");
        const text = area ? area.textContent : "";
        if (text.includes(%(running)s)) mark("running");
        if (record.marker && text.includes(record.marker)) mark("output");
        if (text.includes(%(finished)s)) mark("finished");
        const icon = document.querySelector("#run-btn img");
        const src = icon ? icon.getAttribute("src") || "" : "";
        if (src.includes(%(stop)s)) mark("stopIcon");
        if (record.dom.stopIcon !== undefined && src.includes(%(play)s)) {
            mark("playIconAfterStop");
        }
    };
    new MutationObserver(inspect).observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["src"],
    });
})();
""" % {
    "running": json.dumps(RUNNING_TEXT),
    "finished": json.dumps(FINISHED_TEXT),
    "stop": json.dumps(STOP_ICON),
    "play": json.dumps(PLAY_ICON),
}


def print_only_code_visual(marker):
    return json.dumps(
        {
            "blocks": {
                "languageVersion": 0,
                "blocks": [
                    {
                        "type": "text_print",
                        "id": "pr1976-print",
                        "x": 100,
                        "y": 100,
                        "inputs": {
                            "TEXT": {
                                "shadow": {
                                    "type": "text",
                                    "id": "pr1976-text",
                                    "fields": {"TEXT": marker},
                                }
                            }
                        },
                    }
                ],
            }
        }
    )


def print_only_problem(code_visual, marker):
    """Return why ``code_visual`` is not exactly the print-only probe, or None."""
    try:
        workspace = json.loads(code_visual)
    except (TypeError, ValueError):
        return "workspace is not JSON"
    if not isinstance(workspace, dict) or set(workspace) != {"blocks"}:
        return f"unexpected workspace keys {sorted(workspace)}"
    blocks = workspace["blocks"].get("blocks")
    if not isinstance(blocks, list) or len(blocks) != 1:
        return "workspace must hold exactly one top-level block"
    block = blocks[0]
    if block.get("type") != "text_print":
        return f"top-level block is {block.get('type')!r}, not text_print"
    if "next" in block or "extraState" in block:
        return "text_print block has a following block or extra state"
    inputs = block.get("inputs")
    if not isinstance(inputs, dict) or set(inputs) != {"TEXT"}:
        return f"text_print inputs are {inputs!r}"
    if set(inputs["TEXT"]) != {"shadow"}:
        return "a block is plugged into the text_print input"
    shadow = inputs["TEXT"]["shadow"]
    if shadow.get("type") != "text" or shadow.get("fields") != {"TEXT": marker}:
        return f"text_print input is not the probe text: {shadow!r}"
    if set(shadow) - {"type", "id", "fields"}:
        return f"text shadow has extra keys {sorted(shadow)}"
    return None


@pytest.fixture(scope="module")
def playwright():
    with playwright_sync.sync_playwright() as playwright:
        yield playwright


@pytest.fixture(scope="module")
def browser(playwright):
    browser = playwright.chromium.launch()
    yield browser
    browser.close()


@pytest.fixture
def api(playwright):
    context = playwright.request.new_context(base_url=BASE_URL)
    yield context
    context.dispose()


@pytest.fixture
def probe_program(api):
    """Create a disposable print-only program and delete it afterwards."""
    token = uuid.uuid4().hex[:12]
    marker = f"PR-1976 console latency probe {token}"
    response = api.post("/api/program", data={"name": f"e2e-pr1976-{token}"})
    assert response.status == 201, f"creating the probe failed: {response.status}"
    program_number = response.json()["programNumber"]
    try:
        code_url = f"/api/program/{program_number}/code"
        response = api.put(
            code_url, data={"codeVisual": print_only_code_visual(marker)}
        )
        assert response.ok, f"storing the probe code failed: {response.status}"

        response = api.get(code_url)
        assert response.ok, f"reading back the probe code failed: {response.status}"
        problem = print_only_problem(response.json()["codeVisual"], marker)
        assert problem is None, f"stored probe is not print-only: {problem}"

        yield program_number, marker
    finally:
        response = api.delete(f"/api/program/{program_number}")
        assert response.status == 204, f"deleting the probe failed: {response.status}"
        assert (
            api.get(f"/api/program/{program_number}").status == 404
        ), "the probe program still exists after deletion"
        listed = api.get("/api/program").json()["programs"]
        assert program_number not in [p["programNumber"] for p in listed]


def guard_code_saves(page, program_number, marker):
    """Abort any save of the probe that is not exactly the print-only code."""
    violations = []

    def handle(route):
        request = route.request
        if request.method == "GET":
            route.continue_()
            return
        problem = None
        if request.method != "PUT":
            problem = f"unexpected {request.method}"
        else:
            try:
                body = json.loads(request.post_data or "")
                problem = print_only_problem(body.get("codeVisual"), marker)
            except (TypeError, ValueError, AttributeError):
                problem = "request body is not JSON"
        if problem is None:
            route.continue_()
        else:
            violations.append(problem)
            route.abort()

    page.route(f"**/api/program/{program_number}/code", handle)
    return violations


def frames_for_run(record, marker):
    """Split the recorded frames into the start response, output and result."""
    start = next(
        (
            entry
            for entry in record["frames"]
            if entry["frame"].get("op") == "service_response"
            and entry["frame"].get("service") == "/proxy_run_program_start"
        ),
        None,
    )
    if start is None:
        return None, None, None
    goal_id = start["frame"].get("values", {}).get("proxy_goal_id")

    def topic(entry, name):
        frame = entry["frame"]
        return (
            frame.get("op") == "publish"
            and frame.get("topic") == name
            and frame.get("msg", {}).get("proxy_goal_id") == goal_id
        )

    output = next(
        (
            entry
            for entry in record["frames"]
            if topic(entry, "/proxy_run_program_feedback")
            and any(
                marker in line.get("content", "")
                for line in entry["frame"]["msg"].get("output_lines", [])
            )
        ),
        None,
    )
    result = next(
        (
            entry
            for entry in record["frames"]
            if topic(entry, "/proxy_run_program_result")
        ),
        None,
    )
    return start, output, result


def test_console_renders_print_only_run_without_interaction(browser, probe_program):
    program_number, marker = probe_program
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    try:
        context.add_init_script(RECORDER_JS)
        page = context.new_page()
        violations = guard_code_saves(page, program_number, marker)
        socket_frames = []
        page.on(
            "websocket",
            lambda socket: socket.on(
                "framereceived",
                lambda payload: (
                    socket_frames.append(payload)
                    if isinstance(payload, str) and "proxy_run_program" in payload
                    else None
                ),
            ),
        )

        page.goto(f"{BASE_URL}/program/{program_number}", wait_until="domcontentloaded")
        page.wait_for_selector("#blocklyDiv .blocklySvg", timeout=15000)
        page.wait_for_selector("#run-btn", state="visible", timeout=15000)
        # Run only once the app listens for this run's output and result.
        page.wait_for_function(
            """() => {
                const topics = window.__consoleLatency.sent
                    .filter((op) => op.op === "subscribe")
                    .map((op) => op.topic);
                return topics.includes("/proxy_run_program_feedback")
                    && topics.includes("/proxy_run_program_result");
            }""",
            timeout=15000,
        )

        page.evaluate(
            """(marker) => {
                window.__consoleLatency.marker = marker;
                window.__consoleLatency.runClickedAt = performance.now();
            }""",
            marker,
        )
        # The only interaction with the page. Everything below just observes.
        page.locator("#run-btn").click()

        page.wait_for_function(
            """() => window.__consoleLatency.frames.some(
                (entry) => entry.frame.topic === "/proxy_run_program_result"
            )""",
            timeout=RESULT_TIMEOUT_MS,
        )
        page.wait_for_function(
            """(limit) => {
                const record = window.__consoleLatency;
                const result = record.frames.find(
                    (entry) => entry.frame.topic === "/proxy_run_program_result"
                );
                const settled = record.dom.finished !== undefined
                    && record.dom.output !== undefined;
                return settled || performance.now() - result.at > limit;
            }""",
            arg=STALE_OBSERVATION_MS,
            timeout=STALE_OBSERVATION_MS + 5000,
        )
        record = page.evaluate("""() => ({
                ...window.__consoleLatency,
                finalRunIcon: document
                    .querySelector("#run-btn img")
                    .getAttribute("src"),
            })""")
    finally:
        context.close()

    assert not violations, f"aborted a non print-only save of the probe: {violations}"
    assert socket_frames, "Playwright saw no run-program frames on the rosbridge socket"

    start, output, result = frames_for_run(record, marker)
    assert start is not None, "no /proxy_run_program_start response was received"
    assert output is not None, f"no feedback frame carried the probe output {marker!r}"
    assert result is not None, "no /proxy_run_program_result frame for this run"
    assert result["frame"]["msg"]["exit_code"] == 0, f"probe failed: {result['frame']}"

    dom = record["dom"]
    timeline = {
        "start_response": start["at"],
        "output_frame": output["at"],
        "result_frame": result["at"],
        **{f"dom_{name}": at for name, at in dom.items()},
    }
    clicked = record["runClickedAt"]
    summary = ", ".join(
        f"{name}=+{at - clicked:.1f}ms"
        for name, at in sorted(timeline.items(), key=lambda item: item[1])
    )
    print(f"console latency timeline after Run click: {summary}")

    def assert_rendered(dom_name, frame_at, what):
        assert dom_name in dom, (
            f"{what} never reached the DOM within {STALE_OBSERVATION_MS} ms "
            f"of its frame ({summary})"
        )
        delay = dom[dom_name] - frame_at
        assert delay <= MAX_RENDER_DELAY_MS, (
            f"{what} reached the DOM {delay:.1f} ms after its frame, "
            f"limit {MAX_RENDER_DELAY_MS} ms ({summary})"
        )

    assert_rendered("running", start["at"], "the running state")
    assert_rendered("output", output["at"], "the program output")
    assert_rendered("finished", result["at"], "the successful completion")
    if result["at"] - start["at"] > MAX_RENDER_DELAY_MS:
        assert_rendered("stopIcon", start["at"], "the Stop icon")
    if "stopIcon" in dom:
        assert_rendered("playIconAfterStop", result["at"], "the Run icon after Stop")
    assert (
        PLAY_ICON in record["finalRunIcon"]
    ), f"the Run/Stop button still shows {record['finalRunIcon']} ({summary})"
