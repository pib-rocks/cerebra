# Test Basis — Update librosjs / roslib (PR-1463)

Derived from Jira ticket **PR-1463** ("Update librosjs", category: Software).

This document is the test basis referenced by the ticket's acceptance criteria.
It records the tests that must pass after bumping the ROS JavaScript client
library used by the Cerebra frontend (currently `roslib` ^1.3.0, formerly
published as `librosjs`) to its current stable release.

## Scope

- Repo: `cerebra` (Angular frontend)
- Affected code: `src/app/shared/services/ros-service/ros.service.ts`
- Dependency: `roslib` (successor of `librosjs`) in `package.json`

## Test Cases

### TC-1 — Dependency update & lockfile
- **Given** the `roslib` entry in `cerebra/package.json` is bumped to the
  current stable version
- **When** `npm install` runs
- **Then** `package-lock.json` is regenerated without conflicts and the
  updated version is pinned.

### TC-2 — Build succeeds
- **Given** the updated library is installed
- **When** `npm run build` (ng build) runs
- **Then** it completes with no unresolved peer-dependency or TypeScript
  type errors originating from the library.

### TC-3 — Unit / component tests green
- **Given** the updated library is installed
- **When** the frontend unit tests run
- **Then** the following specs pass:
  - `tests/unit/angular/ros.connection.spec.ts`
  - `src/app/shared/services/ros-service/ros.service.spec.ts`

### TC-4 — Live connection (E2E, manual on robot)
- **Given** a running Cerebra instance connected to the robot via rosbridge
- **When** the UI subscribes to a motor topic AND publishes a program I/O
  message
- **Then** both operations succeed and the browser console shows **no**
  errors related to the ROS client library.

### TC-5 — Test basis documented
- This file (`docs/test-basis/librosjs-update.md`) exists and reflects the
  acceptance criteria of PR-1463.

## Notes

- If the maintained package name differs from the import (`roslib` vs
  `librosjs`), migrate the import in `ros.service.ts` and the `@types`
  dependency accordingly; do not leave a deprecated/abandoned package.
- No user-facing behaviour change is expected — this is a dependency
  maintenance update.
