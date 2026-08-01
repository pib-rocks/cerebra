# PR-1514 — Replace custom Voice-Assistant chat component with deep-chat

Jira: https://pib-rocks.atlassian.net/browse/PR-1514
Branch: `PR-1514` (branched from `develop` @ f9f9a24b)
Repo: `cerebra` (Angular 22, standalone components, Karma/Jasmine)

## Goal

Replace the hand-written chat UI (`ChatWindowComponent`) with the `deep-chat` web
component (v2.5.0, MIT), **while preserving** the existing pib architecture:
ROS 2 rosbridge transport, PIB REST persistence, SmartConnect gating and
Hermes-Agent streaming.

Reference: https://deepchat.dev/docs · https://stackblitz.com/edit/stackblitz-starters-7gygrp

## Hard constraints (DO NOT VIOLATE)

1. **No direct LLM calls from the browser.** `directConnection` and `connect.url`
   are both forbidden. Use `connect.handler` + `signals` only.
2. **Do not refactor** `ChatService`, `RosService`, `TokenService` or
   `VoiceAssistantService` internals. Consume them as-is.
3. Sending must continue to go through `ChatService.sendChatMessage(chatId, text)`
   which internally calls the ROS 2 service `/send_chat_message` with a REST
   fallback (`createChatMessage`).
4. Keep the parent component (`voice-assistant-chat.component.*`) untouched:
   the `Chats / Personality` toggle row and the right sidebar live there.
5. Full Karma suite must stay green. Baseline: **358/358 SUCCESS**
   (`CHROME_BIN=/usr/bin/chromium-browser npm test -- --watch=false`).

## Existing architecture (as-is)

```
app-voice-assistant-chat        (voice-assistant-chat.component.ts)   <- untouched
├── <router-outlet>            → app-chat-window   <- REPLACE THIS
│     ChatWindowComponent      (chat-window.component.ts/.html/.scss)
│       - @for over messages[]  → <markdown> bubbles + USER_ICON / VA_ICON
│       - <input #message-input> + <button #chat-send-button>
│       - chatMessageFormControl (FormControl), textInputActive (len > 2)
└── app-sidebar-right                                                 <- untouched
```

| Layer | Artefact | Responsibility |
|---|---|---|
| Service | `shared/services/chat.service.ts` | `getChatMessagesObservable(chatId)` (BehaviorSubject cache), `getMessagesByChatId` (REST GET), `createChatMessage` (REST POST), `sendChatMessage` (ROS + REST fallback), `filterMessageUpdates` (dedupe) |
| Transport | `shared/services/ros-service/ros.service.ts` | `chatMessageReceiver$` (topic `chat_messages`), `sendChatMessage()` → ROS service `/send_chat_message` |
| Auth gate | `shared/services/token.service.ts` | `tokenStatus$ {tokenExists, tokenActive}` |
| Backend | `pib-backend` `ros_packages/voice_assistant/voice_assistant/chat.py` | Publishes `datatypes/ChatMessage`; re-publishes the SAME `message_id` with growing content while Hermes streams |

### THE CRITICAL CONSTRAINT — streaming contract

The assistant reply does **not** arrive as one message. `ChatNode` re-publishes
the **same `message_id`** repeatedly with growing content. The legacy UI pushes
every ROS event into an array and de-duplicates afterwards via
`filterMessageUpdates()` (keeps the last occurrence per `message_id`).

deep-chat models this with `addMessage(message, isUpdate)` and `overwrite: true`,
**but** expects `signals.onResponse()` to be called **exactly once per turn** to
clear the loading bubble.

Required mapping:
- First non-empty chunk of a turn → `signals.onResponse({role:'ai', text})`
- Every subsequent chunk with the **same** `message_id` →
  `el.addMessage({role:'ai', text, overwrite:true})`
- A **new** `message_id` → append as a new message

This is the highest-risk part of the migration and needs a dedicated unit test.

### Message shape mismatch

```typescript
// ROS msg (shared/ros-types/msg/chat-message.ts)
{ chat_id, message_id, timestamp, is_user, content }

// REST/UI type (shared/types/chat-message.ts)
{ messageId, timestamp, isUser, content }

// deep-chat MessageContent
{ role: "ai" | "user" | string, text?, html?, files?, custom? }
```

## Implementation steps

### Step 1 — Dependency & Angular wiring
- `npm install deep-chat` (v2.5.0). Do **not** install `deep-chat-react`.
- Import the custom element side-effect once: `import 'deep-chat';`
- Add `CUSTOM_ELEMENTS_SCHEMA` to the component's `schemas: []` so the Angular 22
  template compiler accepts `<deep-chat>`.
- Verify the bundle builds with `@angular-devkit/build-angular:browser` and that
  the element registers under Karma/Chromium.

### Step 2 — Mapper layer (pure, unit-testable)
Create `src/app/shared/util/deep-chat-mapper.ts`:

```typescript
// ChatMessage (pib) -> deep-chat MessageContent
export function toDeepChat(m: ChatMessage): MessageContent {
    return {role: m.isUser ? "user" : "ai", text: m.content};
}

// deep-chat submit body -> plain string for ChatService.sendChatMessage
export function extractText(body: {messages: MessageContent[]}): string {
    return body.messages[body.messages.length - 1]?.text ?? "";
}
```
Add `deep-chat-mapper.spec.ts` with full coverage (user/ai roles, empty body,
missing text, single vs. multiple messages).

### Step 3 — New component, parallel (NO environment flag)

There is **no `src/environments/` directory** in this repo, so do not invent one.
Instead:
- Create `src/app/voice-assistant/voice-assistant-chat/chat-window-deep-chat/chat-window-deep-chat.component.ts`
  (+ `.html`, `.scss`, `.spec.ts`).
- Leave `app-routing.module.ts` and the legacy `ChatWindowComponent` **completely
  untouched** in this stage. The new component is not routed yet — it is verified
  by its unit tests only. Routing cut-over happens later in Step 10.

### Step 4 — `connect.handler`
```typescript
@ViewChild('deepChat') deepChatRef!: ElementRef<any>;

ngAfterViewInit() {
  const el = this.deepChatRef.nativeElement;
  el.connect = {
    handler: (body: any, signals: any) => {
      const text = extractText(body);
      const chatId = this.currentChatId!;
      this.pendingSignals = signals;          // resolved by the ROS topic (Step 6)
      this.chatService.sendChatMessage(chatId, text).subscribe({
        error: (e) => signals.onResponse({error: String(e)}),
      });
    },
  };
}
```
All wiring must be imperative in `ngAfterViewInit` — the app uses
`ChangeDetectionStrategy.Eager` and property assignment on a custom element
bypasses Angular bindings.

### Step 5 — History via `loadHistory`
```typescript
el.loadHistory = () =>
  firstValueFrom(this.chatService.getMessagesByChatId(chatId))
    .then(msgs => this.chatService.filterMessageUpdates(msgs).map(toDeepChat));
```
The legacy component reversed the array and rendered with `flex-column-reverse`.
deep-chat expects **natural chronological order (oldest first)** — do **not**
reverse. Keep `filterMessageUpdates()` here because the REST endpoint still
returns duplicate `message_id` rows.

### Step 6 — Streaming updates
- Subscribe `chatService.getChatMessagesObservable(chatId)`.
- Track the last seen `message_id` per turn.
- Same `message_id` as previous → `el.addMessage({role:'ai', text, overwrite:true})`.
- New `message_id` → append new message.
- Resolve `pendingSignals.onResponse(...)` on the first non-empty AI chunk, then
  null it out so it fires only once per turn.
- Ignore echoes of the user's own message (`is_user === true`) — deep-chat has
  already rendered the user bubble locally.

### Step 7 — SmartConnect gating + >2 character rule
```typescript
this.tokenService.tokenStatus$.subscribe(({tokenExists, tokenActive}) => {
  const enabled = tokenExists && tokenActive;
  el.textInput = {
    disabled: !enabled,
    placeholder: {text: enabled
      ? 'Enter a message'
      : 'Enable SmartConnect to start the Voice-Assistant'},
  };
  el.disableSubmitButton(!enabled);
});

el.validateInput = (text?: string) => (text?.trim().length ?? 0) > 2;
```
Behaviour to preserve exactly: submit disabled for **≤ 2 characters**, enabled
from **3 characters** on. Placeholder text when SmartConnect is off must remain
`Enable SmartConnect to start the Voice-Assistant`.

### Step 8 — Styling to the pib theme
Port the dark-navy / pink-frame look from `chat-window.component.scss` using
`style`, `messageStyles`, `inputAreaStyle`, `submitButtonStyles`, `auxiliaryStyle`.
- `avatars`: `assets/voice-assistant-svgs/chat/user.svg` → user,
  `assets/voice-assistant-svgs/chat/pib-icon-speaking.png` → ai
- `names`: show the personality name (currently `personalityName`)
- Markdown in assistant replies must still render (code blocks, lists, bold) —
  deep-chat ships `remarkable`, so `ngx-markdown` is not needed in this path.
- Optional, evaluate but do not enable blindly: `scrollButton`, `focusMode`.

### Step 9 — Tests
- Rewrite the component spec: the current `chat-window.component.spec.ts` asserts
  on the internal `FormControl` and `textInputActive`. New tests must target the
  mapper functions and the handler/signals contract; **mock the web component**
  (do not rely on the real custom element in Karma).
- Add a test proving a streamed reply produces ONE growing bubble (assert
  `overwrite: true` is used and `onResponse` fires exactly once per turn).
- Full suite must stay green (baseline 358/358).

### Step 10 — Cut over (only after Steps 1-9 verified)
- Remove the feature flag.
- Delete `chat-window.component.ts/.html/.scss/.spec.ts`.
- Update `src/app/app-routing.module.ts` to point at the new component.
- Check whether `ngx-markdown` / `marked` are still used elsewhere **before**
  removing them from `package.json` (they are likely used by other features —
  verify with a repo-wide grep and do not remove if still referenced).

## Out of scope
- Replacing the ROS-based voice pipeline with browser `speechToText`/`textToSpeech`
- File/image upload and webcam capture features of deep-chat
- Refactoring `ChatService` / `RosService` internals
- Removing the personality sidebar or chat list

## Definition of done
- `<deep-chat>` renders the Voice-Assistant chat; hand-written bubble/input markup gone
- Sending still goes through ROS 2 `/send_chat_message` with REST fallback
- History loads in correct chronological order
- A streaming Hermes reply renders as ONE continuously growing bubble
- Markdown still renders
- Submit disabled ≤ 2 chars, enabled from 3 chars
- SmartConnect-off shows the disabled input with the correct placeholder
- Visual appearance matches the pib theme (dark navy, pink frame, pib/user avatars)
- `CHROME_BIN=/usr/bin/chromium-browser npm test -- --watch=false` → all green
- `npm run build` succeeds

## Note on E2E tests (separate repo — do NOT touch here)
`pib-backend/tests/e2e/test_voice_assistant_hermes_e2e.py` hard-codes
`#message-input` and `#chat-send-button`. Those selectors will break. Record in
the final summary which selectors/ids the new deep-chat input exposes so the
Playwright tests can be updated in `pib-backend` afterwards.
