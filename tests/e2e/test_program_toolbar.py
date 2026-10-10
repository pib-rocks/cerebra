"""Browser E2E checks for the Blockly program toolbar (PR-1973).

The toolbar (export, save, run/stop, normal/split toggle) is absolutely
positioned. When it lost its positioned editor ancestor it anchored to the app
shell and slid behind the program navigation tabs, where every control
hit-tested to the tabs instead of the button. These tests check geometry and
pointer hit testing, so they fail on that page even though the buttons exist.

Run against a Cerebra instance explicitly:

    PIB_ROBOT_URL=http://<host> python -m pytest tests/e2e/test_program_toolbar.py

Without PIB_ROBOT_URL every test is skipped; nothing is contacted implicitly.
The tests never click Run or Export and never edit or save a program, so no
motor is moved and no program data is changed.
"""

import os

import pytest

playwright_sync = pytest.importorskip("playwright.sync_api")

BASE_URL = os.environ.get("PIB_ROBOT_URL", "").rstrip("/")

pytestmark = pytest.mark.skipif(
    not BASE_URL, reason="set PIB_ROBOT_URL to run program toolbar E2E tests"
)

TOOLBAR_IDS = ("export-btn", "save-btn", "run-btn", "toggle-btn")
TOLERANCE = 1.0

VIEWPORTS = {
    "desktop": {"width": 1920, "height": 1080},
    "narrow": {"width": 390, "height": 844},
}

# Geometry of the program tabs, the editor and every toolbar control, plus the
# element that actually receives a pointer event at each control's centre.
MEASURE_JS = """
(ids) => {
    const rect = (el) => {
        const r = el.getBoundingClientRect();
        return {top: r.top, left: r.left, right: r.right, bottom: r.bottom,
                width: r.width, height: r.height};
    };
    const tabs = document.querySelector("app-program-overview .nav-tabs");
    const editor = document.getElementById("export-btn")
        .closest("app-program-splitscreen").firstElementChild;
    const controls = {};
    for (const id of ids) {
        const el = document.getElementById(id);
        const r = rect(el);
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        controls[id] = {
            rect: r,
            disabled: el.disabled,
            hitsSelf: !!hit && (hit === el || el.contains(hit)),
            hitDescription: hit
                ? hit.tagName.toLowerCase() + (hit.id ? "#" + hit.id : "") +
                  (hit.className && typeof hit.className === "string"
                      ? "." + hit.className.trim().split(/\\s+/).join(".")
                      : "")
                : null,
        };
    }
    return {
        tabs: rect(tabs),
        editor: rect(editor),
        viewport: {width: window.innerWidth, height: window.innerHeight},
        controls,
    };
}
"""


@pytest.fixture(scope="module")
def browser():
    with playwright_sync.sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture(params=sorted(VIEWPORTS))
def page(request, browser):
    context = browser.new_context(viewport=VIEWPORTS[request.param])
    page = context.new_page()
    yield page
    context.close()


def open_first_program(page):
    page.goto(f"{BASE_URL}/program", wait_until="domcontentloaded")
    try:
        page.wait_for_url(f"{BASE_URL}/program/*", timeout=15000)
    except playwright_sync.TimeoutError:
        pytest.skip("no program exists on this instance to open in the editor")
    page.wait_for_selector("#blocklyDiv .blocklySvg", timeout=15000)
    page.wait_for_selector("#toggle-btn", state="visible", timeout=15000)


def collapse_navigation(page):
    toggle = page.locator("#sidebar-toggle-button")
    if toggle.count() and toggle.get_attribute("aria-expanded") == "true":
        toggle.click()
        page.wait_for_function(
            "() => document.querySelector('#sidebar-toggle-button')"
            ".getAttribute('aria-expanded') === 'false'"
        )
    # Let the 0.3 s margin transition of the navigation finish.
    page.wait_for_timeout(500)


def assert_toolbar_reachable(page, label):
    data = page.evaluate(MEASURE_JS, list(TOOLBAR_IDS))
    tabs, editor, viewport = data["tabs"], data["editor"], data["viewport"]

    assert editor["top"] >= tabs["bottom"] - TOLERANCE, (
        f"{label}: editor starts above the program tabs: {editor} vs {tabs}"
    )
    for control_id, control in data["controls"].items():
        r = control["rect"]
        where = f"{label}: {control_id} at {r}"
        assert r["width"] > 0 and r["height"] > 0, f"{where} is not rendered"
        assert r["top"] >= tabs["bottom"] - TOLERANCE, (
            f"{where} sits above the bottom of the program tabs ({tabs['bottom']})"
        )
        assert r["top"] >= editor["top"] - TOLERANCE, f"{where} above editor {editor}"
        assert r["left"] >= editor["left"] - TOLERANCE, f"{where} left of editor {editor}"
        assert r["right"] <= editor["right"] + TOLERANCE, f"{where} right of editor {editor}"
        assert r["bottom"] <= editor["bottom"] + TOLERANCE, f"{where} below editor {editor}"
        assert r["left"] >= -TOLERANCE and r["right"] <= viewport["width"] + TOLERANCE, (
            f"{where} is outside the viewport {viewport}"
        )
        if not control["disabled"]:
            assert control["hitsSelf"], (
                f"{where} is covered by {control['hitDescription']}"
            )
    return data


def test_toolbar_below_tabs_with_navigation_shown(page):
    if page.viewport_size["width"] < 768:
        pytest.skip("below 768px the navigation is an overlay that starts hidden")
    open_first_program(page)
    assert_toolbar_reachable(page, "navigation shown")


def test_toolbar_below_tabs_with_navigation_collapsed(page):
    open_first_program(page)
    collapse_navigation(page)
    assert_toolbar_reachable(page, "navigation collapsed")


def test_save_is_disabled_for_an_unchanged_program(page):
    open_first_program(page)
    collapse_navigation(page)
    data = assert_toolbar_reachable(page, "unchanged program")
    assert data["controls"]["save-btn"]["disabled"], (
        "Save must stay disabled until the program is edited"
    )


def test_split_toggle_switches_views_and_stays_reachable(page):
    open_first_program(page)
    collapse_navigation(page)
    python_area = page.locator("#python-code-area")
    assert python_area.count() == 0

    page.locator("#toggle-btn").click()
    python_area.wait_for(state="visible")
    assert_toolbar_reachable(page, "split view")

    page.locator("#toggle-btn").click()
    python_area.wait_for(state="detached")
    assert_toolbar_reachable(page, "normal view")
