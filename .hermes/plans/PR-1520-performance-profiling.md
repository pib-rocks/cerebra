# PR-1520 — Voice Assistant Chat Performance Profiling & Latency Tracing

Jira Ticket: https://pib-rocks.atlassian.net/browse/PR-1520
Category: Software
Base Branch: `PR-1519`
Target Branch: `PR-1520` (DO NOT MERGE TO DEVELOP)

## Goals
Implement UI-side performance tracing and latency measurement (TTFT) for the Voice Assistant chat component in Cerebra.

## Components to implement

1. **`src/app/shared/services/chat.service.ts`**:
   - Add `[PERF_TRACE_UI]` logging with `performance.now()` for `sendChatMessage()` start, WebSocket dispatch, and first response token receipt.

2. **`src/app/voice-assistant/voice-assistant-chat/chat-window-deep-chat/chat-window-deep-chat.component.ts`**:
   - Add `[PERF_TRACE_UI]` logging measuring TTFT (Time-To-First-Token) from user submit click to first `signals.onResponse` / `addMessage` update.

3. **Karma Specs**:
   - Update `chat-window-deep-chat.component.spec.ts` and `chat.service.spec.ts` to assert performance tracing metrics are recorded.

## Constraints
- Branch off `PR-1519` to `PR-1520`.
- DO NOT MERGE TO DEVELOP.
- Ensure all Karma unit tests pass (`npm test`).
