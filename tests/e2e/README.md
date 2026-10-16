# Read-only live credential-availability regression (PC-51)

This Playwright/pytest regression uses the real robot's REST metadata, unmodified
rosbridge responses, and DOM after a fresh load and reload. It never stores a
dummy key, changes encryption, sends a chat message or starts/stops a service.
Use only the authorized test robot; no implicit localhost or production target.

## Setup

Use a Python virtualenv with `tests/e2e/requirements.txt` and a matching installed
Playwright Chromium. The parent verifier can reuse the existing backend E2E venv.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects a native cached binary.
No browser assets or dependencies are fetched by the test itself.

## Required discriminating control

Run the unavailable-service case during a parent/operator-controlled, safe
voice-runtime maintenance window. The test requires an existing unlocked,
encryption-off store with a persisted cloud credential and at least one cloud
personality. It fails on unmet preconditions rather than silently skipping or
mutating the user's configuration. The real token-service response must say the
service does not exist; no mocked transport is used.

```bash
ROBOT_URL=http://192.168.1.172 EXPECT_TOKEN_SERVICE=unavailable \
  python -m pytest tests/e2e/test_pc51_credential_availability.py -q
```

Repeat with `EXPECT_TOKEN_SERVICE=available` after the combined repaired runtime
is deployed. A healthy-runtime run alone does **not** discriminate the original
bug. Both runs inspect a nonempty sample of cloud personality options against
the actual catalogue and verify that a stored credential is not labelled
`Needs a key`. Screenshots and bounded response/option evidence are written to
pytest's temporary test directory.

The test observes only token-status booleans/errors and non-secret key metadata;
it never requests the credential-value endpoint. No physical audio, recognition,
model authentication or acoustic conversation acceptance is claimed by this test.
