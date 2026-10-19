# System update page

The normal page shows the installed image version, the available published release and its notes, a confirmed Install action, the current phase, and the verified result. SHA tables, attempt counts, logs, force, and the develop channel are under Details / Expert.

Install never starts on page load. A release check is started only when the last result has no `checkedAt`. The page posts the selected channel (`release` or `develop`) and waits until `available.json` carries that check id. An older document stays the previous result.

`POST /system/update` is read as `{job, status}`. `job` has no runner state. Polling uses `status` and resumes through a bounded reconnect while the stack is down. A stale job does not block a new install. Force stays off unless the operator opts in.

The Karma specs under `src/app/system/update/` are component tests. They are not a browser session against a robot.

Hardware release install through this page: **NOT EXECUTED**. The procedure is `docs/UPDATE.md` in pib-backend.
