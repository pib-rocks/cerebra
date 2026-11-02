"""Browser E2E checks for the five movement tabs (Head, hands, arms).

The tabs went blank without anyone noticing: the background image 404'd after the move from
/joint-control to /movement, so the touch points had no picture to sit on and no slider ever
appeared. The page still rendered its layout, which is why no unit test complained.

Each test asserts what a user needs: a loaded picture, touch points, and - after clicking one -
the motor slider with a numeric range.

Run against a Cerebra instance explicitly:

    PIB_ROBOT_URL=http://<host> python -m pytest tests/e2e/test_movement_tabs.py

Without PIB_ROBOT_URL every test is skipped. The tests click a touch point (which only selects a
motor) and never drag a slider, so no motor is moved.
"""

import os
import re

import pytest

playwright_sync = pytest.importorskip("playwright.sync_api")

BASE_URL = os.environ.get("PIB_ROBOT_URL", "").rstrip("/")

pytestmark = pytest.mark.skipif(
    not BASE_URL, reason="set PIB_ROBOT_URL to run movement tab E2E tests"
)

TABS = {
    "head": 6,
    "left-hand": 21,
    "right-hand": 21,
    "left-arm": 18,
    "right-arm": 18,
}

MEASURE_JS = """
() => {
    const image = [...document.querySelectorAll('img')]
        .find((img) => /background/.test(img.getAttribute('src') || ''));
    const touchpoints = document.querySelectorAll('[class*=touchpoint]').length;
    return {
        imageSrc: image ? image.getAttribute('src') : null,
        imageWidth: image ? image.naturalWidth : 0,
        touchpoints,
    };
}
"""


@pytest.fixture(scope="module")
def browser():
    with playwright_sync.sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture()
def page(browser):
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()
    yield page
    context.close()


@pytest.mark.parametrize("tab", sorted(TABS))
def test_tab_has_a_picture_and_touchpoints(page, tab: str) -> None:
    page.goto(f"{BASE_URL}/movement/{tab}", wait_until="networkidle")
    page.wait_for_selector("app-movement-core", timeout=30_000)
    page.wait_for_timeout(2_000)

    state = page.evaluate(MEASURE_JS)

    assert state["imageSrc"], f"{tab}: no background image element"
    assert state["imageWidth"] > 0, f"{tab}: background image did not load ({state['imageSrc']})"
    assert state["touchpoints"] >= TABS[tab], (
        f"{tab}: {state['touchpoints']} touch points, expected at least {TABS[tab]}"
    )


@pytest.mark.parametrize("tab", sorted(TABS))
def test_clicking_a_touchpoint_opens_a_slider(page, tab: str) -> None:
    page.goto(f"{BASE_URL}/movement/{tab}", wait_until="networkidle")
    page.wait_for_selector("[class*=touchpoint] .touch-area", timeout=30_000)

    page.locator("[class*=touchpoint] .touch-area").first.click()

    page.wait_for_selector("app-horizontal-slider", timeout=10_000)
    slider_text = page.locator("app-horizontal-slider").first.inner_text()
    assert re.search(r"-?\d+\s*°", slider_text), (
        f"{tab}: slider shows no degrees, got {slider_text!r}"
    )
    assert "/motor/" in page.url, f"{tab}: clicking a touch point did not open a motor ({page.url})"
