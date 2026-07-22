<!-- AUTO-GENERATED — DO NOT EDIT DIRECTLY -->

# pib-blockly (vendored — auto-generated)

⚠️ **This directory is automatically synchronized from `pib-backend` and must NOT be edited directly here.**

## Single source of truth

All pib-blockly code (blocks + generators) lives canonically in:

```
pib-rocks/pib-backend : pib_blockly/pib_blockly_server/src/pib-blockly/
```

It is mirrored into this cerebra directory (`src/app/program/pib-blockly/`) by the
**"Sync Blockly to cerebra"** GitHub Action. Any push in pib-backend that changes the
Blockly source opens an automated pull request here (branch `sync/blockly-from-<pib-backend-branch>`,
labeled `maintenance`).

## How to make a change

1. Create a feature branch (`PR-XXXX`) in **pib-backend**, from `develop`.
2. Edit `pib_blockly/pib_blockly_server/src/pib-blockly/`.
3. Push. The sync Action creates/updates `cerebra/sync/blockly-from-PR-XXXX` and its PR.
4. Test in cerebra by checking out that sync branch (`npm install && ng test`).
5. Merge the pib-backend PR first, then merge the cerebra sync PR.

## Enforcement

A CI check (`Guard Blockly Single-Source`) **fails any cerebra PR** that edits this path
unless it comes from the sync bot. Direct edits will be rejected in review.

See Jira **PR-1477** and the Knowledge Base page
*"Blockly Code: Single-Source Architecture & Sync"* for full details.
