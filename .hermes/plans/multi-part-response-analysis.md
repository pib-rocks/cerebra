# Investigate: Voice Assistant only shows first part of multi-part responses

Jira: (new ticket to be created)
Scope: Analysis only — DO NOT MODIFY CODE

## Symptom

When Hermes Agent produces a response that has multiple parts (e.g., initial text + MCP tool result + follow-up text), only the first chunk appears in the deep-chat UI. Subsequent chunks are lost.

This likely affects any multi-turn streaming where:
- First chunk: "Let me check that for you..."
- MCP tool call/result
- Second chunk: "Here's what I found: ..."

## Areas to investigate (cerebra repo)

### 1. Streaming handler in `chat-window-deep-chat.component.ts`
- `handleStreamedMessages()` — tracks `lastStreamedMessageId` and uses `pendingSignals.onResponse()` for first chunk, then `el.addMessage({overwrite: true})` for subsequent chunks with same `messageId`
- Question: Does the backend emit the SAME `messageId` for all chunks of a logical response, or a NEW `messageId` for each part?

### 2. Backend message emission (`pib-backend` → ROS → `chat.service.ts`)
- `chat.service.ts`: `getChatMessagesObservable()` — what does it emit? Full array each time? Single new message?
- `hermes_agent_client.py`: How does Hermes streaming map to DB records? One DB row per chunk or one per logical turn?
- ROS 2 `send_chat_message` service: Does it return streaming chunks or one response?

### 3. MCP tool integration
- When Hermes calls an MCP tool, does it emit intermediate "tool call" messages with distinct IDs?
- Does the final synthesized response get a new `messageId` or reuse the original?

### 4. deep-chat expectations
- `onResponse({role: "ai", text: content})` — resolves the pending user turn
- `addMessage({role: "ai", text: content, overwrite: true})` — appends/overwrites for streaming
- `addMessage({role: "ai", text: content})` — new message (new `messageId`)

## Required output from analysis

1. **Trace a real multi-part response**: What `messageId`s does the backend emit for a turn that includes MCP tool use?
2. **Identify the mismatch**: Is `handleStreamedMessages()` assuming same `messageId` but backend emits different ones? Or vice versa?
3. **Locate the exact fix point**: Component, service, or backend?
4. **Propose minimal fix**: Change the ID tracking logic, or change backend emission, or both.

## Constraints

- READ ONLY — no code changes
- Report findings with file:line references
- If the fix requires backend changes, note that separately