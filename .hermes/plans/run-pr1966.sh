#!/usr/bin/env bash
set -uo pipefail
cd /home/pib/opencode/cerebra-pr1966
export PATH="$HOME/.local/bin:$PATH"
export CURSOR_API_KEY="$(grep -E '^CURSOR_API_KEY=' /home/pib/.hermes/.env | cut -d= -f2- | tr -d '"')"
PROMPT_FILE=".hermes/plans/PR-1966-prompt.txt"
[ -s "$PROMPT_FILE" ] || { echo "ABBRUCH: Prompt fehlt"; exit 2; }
echo "WORKTREE=$(pwd)"
echo "BRANCH_BEFORE=$(git branch --show-current)"
echo "BRANCH_HEAD=$(git rev-parse --short HEAD)"
echo "PROMPT_LINES=$(wc -l < "$PROMPT_FILE")"
echo "PROMPT_SHA256=$(sha256sum < "$PROMPT_FILE" | cut -c1-16)"
timeout 3600 cursor-agent --print --force --trust --output-format text "$(cat "$PROMPT_FILE")"
echo "CURSOR_EXIT=$?"
echo "=== git status:"; git status --short | grep -v '^??'
echo "=== diff stat:"; git diff --stat
echo "=== Blockly-Baum angefasst? (muss leer sein)"; git status --short | grep 'pib-blockly/' || echo "   sauber"
echo "=== Alte Radios noch da? (muss leer sein)"
grep -n "RBN_Channel_\|type=\"radio\"" src/app/voice-assistant/voice-assistant.component.html || echo "   keine"
echo "=== Der neue Toggle:"
grep -n -B4 -A12 "toggle-switch" src/app/voice-assistant/voice-assistant.component.html | head -30 | sed 's/^/   /'
echo "=== Tests"
CHROME=$(find /home/pib/.cache/ms-playwright -maxdepth 3 -type f -name chrome 2>/dev/null | head -1)
CHROME_BIN="$CHROME" npx ng test --watch=false --browsers=NoSandbox 2>&1 | grep -aE "TOTAL|FAILED" | tail -3 | sed 's/^/   /'
