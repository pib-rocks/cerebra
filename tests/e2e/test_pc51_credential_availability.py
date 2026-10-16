"""Read-only live PC-51 regression; no key seeding or chat messages.

Explicit inputs: ROBOT_URL and EXPECT_TOKEN_SERVICE=unavailable|available.
The unavailable run discriminates the original false-missing-key defect.
"""
import json
import os

import pytest
import requests
from playwright.sync_api import sync_playwright


TOKEN_CAPTURE = r"""(() => {
  const Native = window.WebSocket;
  window.__pc51TokenEvents = [];
  window.WebSocket = class extends Native {
    constructor(...args) {
      super(...args);
      this.addEventListener('message', event => {
        try {
          const m = JSON.parse(event.data);
          if (m.op === 'service_response' &&
              String(m.service || '').replace(/^\/+/, '') === 'get_token_exists') {
            window.__pc51TokenEvents.push({result: m.result, values: m.values});
          }
        } catch (_) { /* Ignore unrelated non-JSON application traffic. */ }
      });
    }
  };
})();"""


def test_stored_cloud_credential_is_not_missing_after_reload(tmp_path):
    """Real REST metadata + real ROS response + fresh and reloaded DOM."""
    base = os.environ.get("ROBOT_URL", "").rstrip("/")
    expected_service = os.environ.get("EXPECT_TOKEN_SERVICE")
    assert base.startswith(("http://", "https://")), "Set explicit ROBOT_URL."
    assert expected_service in ("available", "unavailable"), (
        "Set EXPECT_TOKEN_SERVICE explicitly; do not pass the unavailable "
        "regression using only a healthy-runtime control."
    )
    session = requests.Session()
    session.trust_env = False

    def get(path):
        response = session.get(base + "/api" + path, timeout=10)
        response.raise_for_status()
        return response.json()

    status = get("/system/key-store")
    assert status.get("encryptKeyStorage") is False and status.get("mode") == "unlocked", (
        "Requires an existing unlocked encryption-off store. This test never changes it."
    )
    cloud = next(
        m for m in get("/assistant-model")["assistantModels"]
        if m["apiName"] == "pib-cloud"
    )
    assert cloud.get("credentialRef"), "Requires an existing stored cloud credential."
    targets = [
        p for p in get("/voice-assistant/personality")["voiceAssistantPersonalities"]
        if p.get("modelRef") == f"model:{cloud['id']}"
        or p.get("providerRef") == str(cloud["id"])
    ]
    assert targets, "No cloud sample: the test must not pass vacuously."
    report = {"real_live_test": True, "expected_service": expected_service, "loads": []}
    with sync_playwright() as pw:
        launch = {"headless": True, "args": ["--no-sandbox"]}
        if os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"):
            launch["executable_path"] = os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"]
        browser = pw.chromium.launch(**launch)
        context = browser.new_context()
        context.add_init_script(TOKEN_CAPTURE)
        page = context.new_page()
        try:
            for iteration in range(2):
                if iteration:
                    page.reload(wait_until="domcontentloaded")
                else:
                    page.goto(base + "/voice-assistant", wait_until="domcontentloaded")
                page.locator("#personality-select").wait_for(state="visible", timeout=20000)
                page.wait_for_function(
                    "document.querySelectorAll('#personality-select option').length > 0",
                    timeout=20000,
                )
                page.wait_for_function("window.__pc51TokenEvents.length > 0", timeout=25000)
                page.evaluate(
                    "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))"
                )
                events = page.evaluate("window.__pc51TokenEvents")
                if expected_service == "unavailable":
                    assert any(
                        x.get("result") is False
                        and "does not exist" in str(x.get("values"))
                        for x in events
                    ), "Unavailable control must use the real missing-service response."
                else:
                    assert any(x.get("result") is True for x in events)
                rows = []
                for person in targets:
                    option = page.locator(
                        '#personality-select option[value="' + person["personalityId"] + '"]'
                    )
                    assert option.count() == 1
                    rows.append({"id": person["personalityId"], "text": option.inner_text()})
                report["loads"].append({"reload": bool(iteration), "events": events, "options": rows})
                page.screenshot(path=str(tmp_path / f"pc51-load-{iteration}.png"), full_page=True)
                assert all("Needs a key" not in row["text"] for row in rows), (
                    "Persisted cloud credential incorrectly shown as missing: " + json.dumps(rows)
                )
        finally:
            (tmp_path / "pc51-live-result.json").write_text(json.dumps(report, indent=2))
            browser.close()
