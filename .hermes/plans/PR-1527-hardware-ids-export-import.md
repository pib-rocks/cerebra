# PR-1527 — Export and Import of Hardware IDs and Bricklet Mappings

Jira Ticket: https://pib-rocks.atlassian.net/browse/PR-1527
Category: Software
Branch: `PR-1527`

## Goals
Implement UI controls in System / Hardware settings for exporting and importing Hardware IDs:
- "Export Hardware-IDs" button (triggers JSON file download).
- "Import Hardware-IDs" button and file upload modal with validation & preview.

## Tasks
1. Angular UI components & service calls (`src/app/system/diagnostics/` or hardware settings).
2. Karma Unit Specs (`npm test`).
3. Merge into `develop` upon success and push to `origin/develop` (DO NOT DEPLOY TO PI).
