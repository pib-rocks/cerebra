"""Browser E2E regression for the System/Diagnose page (PR-2001).

The page had a manual "Refresh" button that the operator had to press. It now refreshes itself once per second
(an ``interval(1000)`` started in ``ngOnInit`` and unsubscribed in ``ngOnDestroy``). These checks guard the
three properties that change promised, which a unit test cannot see end to end:

* the button, its ``data-test`` hook and its icon stay out of the header,
* a full round of telemetry requests repeats about every second,
* leaving the page stops the polling, so the robot is not polled forever.

Read-only: the page is opened and observed, nothing is clicked that changes state, no motor moves, no setting is
stored. The test observes only the requests the page issues itself.

Run against a Cerebra instance explicitly:

    PIB_ROBOT_URL=http://<host> python -m pytest tests/e2e/test_diagnostics_autorefresh.py

Without PIB_ROBOT_URL every test is skipped; nothing is contacted implicitly. ``PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH``
selects a native Chromium binary, like the other suites here.
"""

import contextlib
import os
import time

import pytest

playwright_sync = pytest.importorskip("playwright.sync_api")

BASE_URL = os.environ.get("PIB_ROBOT_URL", "").rstrip("/")
CHROMIUM = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH") or None

pytestmark = pytest.mark.skipif(
    not BASE_URL, reason="set PIB_ROBOT_URL to run the diagnostics auto-refresh E2E tests"
)

DIAGNOSTICS_PATH = "/system/diagnostics"
HEADLINE = "System Diagnostics & Telemetry"
ROUND_ENDPOINTS = (
    "/api/diagnostics/system",
    "/api/diagnostics/summary",
    "/api/diagnostics/bricklets",
)

# One interval tick is 1000 ms; the window allows for scheduling and network jitter.
ROUND_MIN_MS = 800
ROUND_MAX_MS = 1400
OBSERVE_SECONDS = 6.0
SETTLE_SECONDS = 1.5
LEAVE_SECONDS = 3.0
MIN_ROUNDS = 5


class _DiagnosticsRequests:
    """Collects the timestamps of the telemetry requests the page issues."""

    def __init__(self):
        self.stamps = []

    def __call__(self, request):
        if "/api/diagnostics" in request.url:
            self.stamps.append((time.monotonic(), request.url))

    def clear(self):
        self.stamps.clear()

    def at(self, endpoint):
        return [stamp for stamp, url in self.stamps if url.endswith(endpoint)]


@contextlib.contextmanager
def _open_page(recorder):
    with playwright_sync.sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROMIUM)
        try:
            page = browser.new_page(viewport={"width": 1400, "height": 900})
            page.on("request", recorder)
            page.goto(f"{BASE_URL}{DIAGNOSTICS_PATH}", wait_until="domcontentloaded", timeout=60000)
            # A periodic page never reaches "networkidle", so the headline is the readiness signal.
            page.wait_for_selector(f"text={HEADLINE}", timeout=30000)
            page.wait_for_timeout(int(SETTLE_SECONDS * 1000))
            yield page
        finally:
            browser.close()


def _round_gaps_ms(system_requests):
    return [round((later - earlier) * 1000) for earlier, later in zip(system_requests, system_requests[1:])]


def test_no_manual_refresh_button(tmp_path):
    """The header must not offer a manual refresh any more."""
    recorder = _DiagnosticsRequests()
    with _open_page(recorder) as page:
        dom = page.evaluate(
            """() => ({
                byId: !!document.querySelector('#btn-refresh-diagnostics'),
                byHook: !!document.querySelector('[data-test="BTN_Refresh_Diagnostics"]'),
                icon: !!document.querySelector('.fa-sync-alt'),
                headline: ((document.querySelector('h3') || {}).textContent || '').trim(),
            })"""
        )
        page.screenshot(path=str(tmp_path / "diagnostics-header.png"))

    assert "System Diagnostics" in dom["headline"], dom
    assert not dom["byId"], "the manual refresh button is still in the DOM"
    assert not dom["byHook"], "the BTN_Refresh_Diagnostics hook is still in the DOM"
    assert not dom["icon"], "the refresh icon is still rendered"


def test_telemetry_round_repeats_every_second(tmp_path):
    """A round of the three telemetry requests must repeat about every second."""
    recorder = _DiagnosticsRequests()
    with _open_page(recorder) as page:
        recorder.clear()
        page.wait_for_timeout(int(OBSERVE_SECONDS * 1000))
        page.screenshot(path=str(tmp_path / "diagnostics-auto-refresh.png"))

    system_requests = recorder.at(ROUND_ENDPOINTS[0])
    gaps = _round_gaps_ms(system_requests)
    assert len(system_requests) >= MIN_ROUNDS, (
        f"{len(system_requests)} request(s) to {ROUND_ENDPOINTS[0]} within {OBSERVE_SECONDS:.0f}s "
        f"(gaps {gaps}) - the page does not refresh itself every second"
    )
    for gap in gaps:
        assert ROUND_MIN_MS <= gap <= ROUND_MAX_MS, (
            f"the refresh interval is not one second: gaps between rounds are {gaps} ms"
        )
    for endpoint in ROUND_ENDPOINTS:
        count = len(recorder.at(endpoint))
        assert count >= MIN_ROUNDS, f"{endpoint} was requested only {count} time(s): {gaps}"


def test_polling_stops_after_leaving_the_page():
    """The interval belongs to the component: another page must not keep polling."""
    recorder = _DiagnosticsRequests()
    with _open_page(recorder) as page:
        recorder.clear()
        page.wait_for_timeout(1200)
        assert recorder.stamps, "the diagnostics page did not poll at all while it was open"
        page.goto(f"{BASE_URL}/", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(int(SETTLE_SECONDS * 1000))
        recorder.clear()
        page.wait_for_timeout(int(LEAVE_SECONDS * 1000))

    assert not recorder.stamps, (
        f"{len(recorder.stamps)} diagnostics request(s) after leaving the page - the interval survived "
        "the destroyed component"
    )
