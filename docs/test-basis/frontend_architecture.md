# Cerebra Frontend Architecture (Test Basis)

> Branch baseline: `PR-1453`  
> Source root: `src/app/`  
> Purpose: machine-readable architecture reference for automated test generation (Cypress / Playwright / Robot Framework).

---

## 1. Tech Stack & Technologies

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Angular | 18.0.x |
| Language | TypeScript | ~5.4 |
| Reactivity | RxJS | ~7.8 (`BehaviorSubject`, `Observable`, `ReplaySubject`) |
| Robot bridge | roslib | ^1.3.0 (WebSocket to ROSBridge) |
| HTTP client | `@angular/common/http` via `ApiService` | Base path `/api` |
| Visual programming | Blockly | ^10.2.2 (Git submodule `src/app/program/pib-blockly`) |
| Layout / UI shell | AdminLTE 3 | ^3.2.0-rc |
| CSS | Bootstrap 5 | ^5.3.3 |
| Angular UI | `@ng-bootstrap/ng-bootstrap` | ^17.0.0 (modals, dropdowns) |
| Angular UI | `@angular/material` | ^18.0.6 (slider, snack-bar, dialog, tooltip) |
| Split layout | angular-split | 15.0.0 |
| Code display | ngx-highlightjs | Python preview in program editor |
| Markdown | ngx-markdown, marked | Personality descriptions |
| Icons | bootstrap-icons, font-awesome | |
| State management | **Service-owned RxJS subjects** | **No NgRx** |
| Global errors | `CerebraErrorHandler` | Logs to console only |
| Dev proxy | `proxy.config.ts` | `/api` → Flask backend `:5000` |
| Dev mock | json-server + `RosMockService` | `npm run cerebra-mock-backend` |
| Test runner | Karma + Jasmine | `ng test` |

### Build configurations (`angular.json`)

| Config | Purpose |
|---|---|
| `development` | Source maps, no optimization |
| `production` | Output hashing, bundle budget 4 MB |
| `rosmock` | Replaces `RosService` with `RosMockService` |

### Network endpoints (`global-conf.json`)

| Setting | Dev | Production |
|---|---|---|
| HTTP API | `http://localhost:5000` (via proxy `/api`) | Same host as UI, proxied `/api` |
| ROS WebSocket | `ws://localhost:9090` | `ws://{window.location.hostname}:9090` |

---

## 2. System Boundaries

### Frontend responsibilities

| Area | Frontend handles |
|---|---|
| UI / routing | All pages, guards, resolvers, modals |
| Blockly editor | Workspace init, block editing, JSON serialization, Python preview generation |
| Program persistence | CRUD programs + save/load `codeVisual` JSON via REST |
| Program execution UI | Run/stop button, console output, stdin input, execution state |
| Motor control UI | Sliders, settings forms, live position/current display |
| Pose management UI | List, save, rename, delete, apply, update motor positions |
| Camera UI | Preview toggle, resolution/quality/refresh sliders |
| Voice assistant UI | Personality CRUD, chat UI, message display |
| Smart Connect UI | Token encrypt/decrypt/delete via ROS |
| Hardware ID UI | Tinkerforge bricklet UID assignment |
| RGB button mapping UI | Map bricklets to program numbers |

### Delegated to backend / ROS

| Area | Delegated to |
|---|---|
| Persistent data | Flask REST API (`/api/*`) |
| Real-time robot state | ROSBridge WebSocket + ROS nodes |
| Program execution | ROS `/proxy_run_program_start` → backend converts `codeVisual` to Python and runs subprocess |
| Motor movement | ROS `/apply_joint_trajectory`, `/apply_motor_settings` |
| Camera frames | ROS `/camera_topic` subscription |
| Chat AI responses | ROS `/send_chat_message` + `/chat_messages` topic |
| Token crypto | ROS `/encrypt_token`, `/decrypt_token`, `/get_token_exists` |
| Solid-state relay | ROS `/set_solid_state_relay_state`, topic `/solid_state_relay_state` |

### Explicit non-responsibilities

- Python code from Blockly is **not** sent on run; only `program_number` is sent via ROS.
- Backend compiles `codeVisual` JSON to Python at execution time.
- No direct WebRTC; camera uses base64 JPEG over ROS topic.

---

## 3. Routing

**File:** `src/app/app-routing.module.ts`  
**Strategy:** `paramsInheritanceStrategy: "always"`

| Route | Component | Guards / Resolvers |
|---|---|---|
| `/joint-control/:joint-name` | `JointControlCoreComponent` | `jointGuard`, `jointResolver` |
| `/joint-control/:joint-name/motor/:motor-name` | `MotorPositionComponent` | `motorGuard`, `motorResolver` |
| `/system/hardware-ids` | `HardwareIdComponent` | — |
| `/pose` | `PoseComponent` | — |
| `/camera` | `CameraComponent` | — |
| `/voice-assistant/:personalityUuid` | `PersonalityDescriptionComponent` | `voiceAssistantResolver` |
| `/voice-assistant/:personalityUuid/chat/:chatUuid` | `ChatWindowComponent` | `chatResolver` |
| `/program` | `ProgramManagerComponent` | — |
| `/program/rgb-led-button` | `RgbLedButtonComponent` | — |
| `/program/:program-number` | `ProgramSplitscreenComponent` | `SaveConfirmationGuard`, `programCodeResolver` |
| `/` | redirect → `/joint-control/head` | — |
| `**` | redirect → `/joint-control/head` | — |

**Valid joint path params:** `head`, `left-hand`, `right-hand`, `left-arm`, `right-arm`

---

## 4. Blockly Integration

### 4.1 Embedding model

| Item | Detail |
|---|---|
| Submodule | `src/app/program/pib-blockly` → `https://github.com/pib-rocks/pib-blockly.git` |
| Workspace component | `ProgramWorkspaceComponent` |
| Parent orchestrator | `ProgramSplitscreenComponent` |
| Toolbox definition | `src/app/program/program-overview/program-manager/blockly.ts` (XML string) |
| Block registration | `pib-blockly/program-blocks/custom-blocks.ts` → `customBlockDefinition()` |
| Python generators | `pib-blockly/program-generators/custom-generators.ts` → `pythonGenerator` |

### 4.2 Workspace initialization flow

```
ProgramCodeResolver
  → GET /api/program/{programNumber}/code
  → ProgramSplitscreenComponent.codeVisualOld

ProgramWorkspaceComponent.ngOnInit()
  → Blockly.inject("blocklyDiv", { toolbox, theme: customTheme })
  → customBlockDefinition()
  → PoseService.getPosesObservable() → updatePoseBlockDropdown()
  → workspace.addChangeListener(...)  // sync on block edits
  → router.events (GuardsCheckStart)  // flush JSON before navigation

ProgramWorkspaceComponent.ngAfterViewInit()
  → workspaceContent = codeVisual  // Blockly.serialization.workspaces.load()
  → ResizeObserver → Blockly.svgResize()
```

### 4.3 Serialization format

| Direction | API | Format |
|---|---|---|
| Save / load | `ProgramCode.codeVisual` | Blockly 10 JSON string (`Blockly.serialization.workspaces.save/load`) |
| Preview only | `pythonGenerator.workspaceToCode()` | Python string (not persisted) |
| Run payload | ROS `{ program_number }` | No workspace JSON sent at run time |

**Type:** `src/app/shared/types/program-code.ts`

```typescript
interface ProgramCode {
  codeVisual: string; // JSON string
}
```

### 4.4 Angular ↔ Blockly communication

| Direction | Mechanism | Trigger |
|---|---|---|
| Blockly → Angular | `@Output codeVisualChange` | Block create/change/delete/move (not while dragging) |
| Blockly → Angular | `@Output codePythonChange` | Same events + `codeVisual` input change |
| Blockly → Angular | `@Output trashcanFlyoutChange` | Trash flyout open/resize |
| Angular → Blockly | `@Input codeVisual` | Route resolver load, external programmatic update |
| Angular → Blockly | `Blockly.Blocks["move_to_pose"].getPoses` | Pose list updates from `PoseService` |
| Router → Blockly | `GuardsCheckStart` | Emits final `codeVisualChange` before leave |

**Filtered Blockly event types:** `BLOCK_CHANGE`, `BLOCK_CREATE`, `BLOCK_DELETE`, `BLOCK_MOVE`

### 4.5 Toolbox categories (PR-1453)

| Category | Block types |
|---|---|
| Logic, Loops, Math, Text, Lists, Colour | Standard Blockly |
| Time | `sleep_for_seconds`, `get_system_time` |
| Variables | `VARIABLE_DYNAMIC` (extended with list variable button) |
| Functions | `PROCEDURE` |
| System | `run_script`, `set_solid_state_relay`, `get_solid_state_relay` |
| Motoric skills | `move_motor`, `move_to_pose` |
| Language skills | `play_audio_from_speech` |
| Visual Skills | `face_detector_start_stop`, `face_detector_running` |

Custom blocks exist in submodule for additional types (WAV, TF buttons, vision, display) but are **not** in toolbox XML on this branch.

### 4.6 Program run flow

```
User clicks Run (ProgramSplitscreenComponent.runProgram)
  → saveCode() → PUT /api/program/{n}/code { codeVisual }
  → inSplitMode = true
  → ProgramService.runProgram(programNumber)
      → executionState = STARTING
      → RosService.runProgram → /proxy_run_program_start { program_number }
      → on goal handle:
          → executionState = RUNNING
          → feedback.output_lines → ProgramLogLine[] (isError = is_stderr)
          → result.exit_code → FINISHED_SUCCESSFUL | FINISHED_ERROR
  User clicks Stop while RUNNING
  → ProgramService.terminateProgram → cancel goal → INTERRUPTED
  User types in console while RUNNING
  → RosService.publishProgramInput → topic /program_input { input, mpid }
```

---

## 5. REST API Contracts

All paths prefixed with `/api` in browser. Dev proxy strips `/api` prefix.

### 5.1 Programs

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/program` | — | `{ programs: Program[] }` |
| GET | `/program/{programNumber}` | — | `{ name, programNumber }` |
| POST | `/program` | `{ name, programNumber? }` | `{ name, programNumber }` |
| PUT | `/program/{programNumber}` | `{ name }` | `{ name, programNumber }` |
| DELETE | `/program/{programNumber}` | — | — |
| GET | `/program/{programNumber}/code` | — | `{ codeVisual: string }` |
| PUT | `/program/{programNumber}/code` | `{ codeVisual: string }` | `{ codeVisual: string }` |

**Service:** `ProgramService`

### 5.2 Poses

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/pose` | — | `{ poses: PoseDTO[] }` |
| POST | `/pose` | `{ name, motorPositions: [{ motorName, position }] }` | `PoseDTO` |
| PATCH | `/pose/{poseId}` | `{ name }` | — |
| DELETE | `/pose/{poseId}` | — | — |
| GET | `/pose/{poseId}/motor-positions` | — | `{ motorPositions: [...] }` |
| PATCH | `/pose/{poseId}/motor-positions` | `{ motorPositions: [...] }` | — |

**Service:** `PoseService`

### 5.3 Motors

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/motor` | — | `{ motors: MotorDTO[] }` |

**Service:** `MotorService` (initial config only; live updates via ROS)

### 5.4 Camera

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/camera-settings` | — | `CameraSettings` object |
| PUT | `/camera-settings` | `CameraSettings` | — |

**Service:** `CameraService`

### 5.5 Voice assistant

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/voice-assistant/personality` | — | `{ voiceAssistantPersonalities: [...] }` |
| POST | `/voice-assistant/personality` | Personality DTO | Personality DTO |
| PUT | `/voice-assistant/personality/{id}` | Personality DTO | Personality DTO |
| DELETE | `/voice-assistant/personality/{id}` | — | — |
| GET | `/assistant-model` | — | `{ assistantModels: [...] }` |

**Service:** `VoiceAssistantService`

### 5.6 Chats

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/voice-assistant/chat` | — | `{ voiceAssistantChats: [...] }` |
| POST | `/voice-assistant/chat` | `{ topic, personalityId }` | Chat DTO |
| GET | `/voice-assistant/chat/{chatId}` | — | Chat DTO |
| PUT | `/voice-assistant/chat/{chatId}` | Chat DTO | Chat DTO |
| DELETE | `/voice-assistant/chat/{chatId}` | — | — |
| GET | `/voice-assistant/chat/{chatId}/messages` | — | `{ messages: ChatMessage[] }` |
| POST | `/voice-assistant/chat/{chatId}/messages` | `{ content, isUser: true }` | ChatMessage |

**Service:** `ChatService`

### 5.7 Hardware / buttons

| Method | URL | Request body | Response |
|---|---|---|---|
| GET | `/bricklet` | — | `{ bricklets: Bricklet[] }` |
| PUT | `/bricklet/{brickletNumber}` | `{ uid: string \| null }` | — |
| GET | `/button-programs` | — | `{ buttonPrograms: ButtonProgram[] }` |
| PUT | `/button-programs` | `{ buttonProgramUpdates: ButtonProgram[] }` | `{ buttonPrograms: [...] }` |
| GET | `/host-ip` | — | `{ host_ip: string }` |

**Services:** `BrickletService`, `RgbLedButtonService`, `IpRetrieverComponent`

---

## 6. ROS / WebSocket Contracts

**Connection:** `RosService.setUpRos()` → `ws://{host}:9090`  
**Connection state:** `RosService.connectionStatus$` (`BehaviorSubject<boolean>`)

| Event | `connectionStatus$` value |
|---|---|
| Initial | `false` |
| ros `"connection"` | `true` (topics/services initialized) |
| ros `"error"` | `false` |
| ros `"close"` | `false` |

### 6.1 ROS services (callService)

| Service path | Request | Response | Caller |
|---|---|---|---|
| `/proxy_run_program_start` | `{ program_number: string }` | `{ proxy_goal_id: string }` | `ProgramService.runProgram` |
| `/proxy_run_program_stop` | `{ proxy_goal_id: string }` | — | `ProgramService.terminateProgram` |
| `/apply_joint_trajectory` | `ApplyJointTrajectoryRequest` | `{ successful: boolean }` | `MotorService.setPositions` |
| `/apply_motor_settings` | `ApplyMotorSettingsRequest` | `{ successful: boolean }` | `MotorService.applySettings` |
| `/set_solid_state_relay_state` | `{ solid_state_relay_state: { turned_on } }` | `{ successful: boolean }` | `RelayControlComponent` |
| `/send_chat_message` | `{ chat_id, content }` | — | `ChatService.sendChatMessage` |
| `/get_chat_is_listening` | `{ chat_id }` | `{ listening: boolean }` | `ChatService.getIsListeningObservable` |
| `/set_voice_assistant_state` | `{ turned_on, chat_id }` | — | `VoiceAssistantService` |
| `/get_voice_assistant_state` | — | `{ turned_on, chat_id }` | `RosService` |
| `/get_token_exists` | `{}` | `{ token_exists, token_active }` | `TokenService` |
| `/encrypt_token` | `{ token, password }` | — | `SmartConnectComponent` |
| `/decrypt_token` | `{ password }` | — | `SmartConnectComponent` |

### 6.2 ROS topics (subscribe)

| Topic | Message type | Consumer |
|---|---|---|
| `/joint_trajectory` | JointTrajectory | `MotorService` (positions) |
| `/motor_current` | DiagnosticStatus | `MotorService` (current) |
| `/motor_settings` | MotorSettingsMessage | `MotorService` |
| `/camera_topic` | string (base64 JPEG) | `CameraService` |
| `/quality_factor_topic` | int32 | `CameraService` |
| `/size_topic` | int32MultiArray | `CameraService` |
| `/timer_period_topic` | float64 | `CameraService` |
| `/chat_messages` | ChatMessage | `ChatService` |
| `/chat_is_listening` | ChatIsListening | `ChatService` |
| `/voice_assistant_state` | VoiceAssistantState | `VoiceAssistantService` |
| `/solid_state_relay_state` | SolidStateRelayState | `RelayControlComponent` |
| `/proxy_run_program_feedback` | ProxyRunProgramFeedback | `RosService.runProgram` |
| `/proxy_run_program_result` | ProxyRunProgramResult | `RosService.runProgram` |
| `/proxy_run_program_status` | ProxyRunProgramStatus | `RosService.runProgram` |

### 6.3 ROS topics (publish)

| Topic | Payload | Caller |
|---|---|---|
| `/program_input` | `{ input: string, mpid: number }` | `ProgramService.provideProgramInput` |
| `/quality_factor_topic` | `{ data: number }` | `CameraService.setQualityFactor` |
| `/size_topic` | `{ data: [width, height] }` | `CameraService.setPreviewSize` |
| `/timer_period_topic` | `{ data: number }` | `CameraService.setTimerPeriod` |
| `/delete_token` | — | `SmartConnectComponent` |

---

## 7. State Management

**Pattern:** Injectable services with `BehaviorSubject` / `Map<string, BehaviorSubject<T>>`. No global store.

### 7.1 Robot connection state

| Observable | Source | Values | UI consumers |
|---|---|---|---|
| `RosService.connectionStatus$` | ROSBridge WebSocket events | `true` / `false` | `TokenService` (waits for first `true`) |
| `TokenService.tokenStatus$` | ROS `/get_token_exists` | `{ tokenExists, tokenActive }` | `SmartConnectComponent`, `ChatWindowComponent` |
| `RosService.solidStateRelayStateReceiver$` | ROS topic | `{ turned_on }` / `undefined` | `RelayControlComponent.isRelayAvailable` |

**Note:** No global “robot connected” banner. ROS disconnect blocks topic publish (console error: `"ROS is not connected."`).

### 7.2 Program / Blockly state

| State | Storage | Key |
|---|---|---|
| Program list | `ProgramService.programsSubject` | global |
| Visual code cache | `ProgramService.programNumberToCode` | per `programNumber` |
| Execution state | `ProgramService.programNumberToState` | per `programNumber` |
| Console logs | `ProgramService.programNumberToLogs` | per `programNumber` |
| Stdin mpid | `ProgramService.programNumberToMpid` | per `programNumber` |
| Unsaved edits | `ProgramSplitscreenComponent.codeVisualNew` vs `codeVisualOld` | component-local |

**ExecutionState enum** (`program-state.ts`):

| Value | Name | Meaning |
|---|---|---|
| 0 | `NOT_STARTED` | Never run since page load |
| 1 | `STARTING` | Run requested, awaiting goal handle |
| 2 | `RUNNING` | Executing |
| 3 | `FINISHED_SUCCESSFUL` | Exit code 0 |
| 4 | `FINISHED_ERROR` | Exit code ≠ 0 |
| 5 | `INTERRUPTED` | User stopped |

### 7.3 Motor state

| State | Storage | Key |
|---|---|---|
| Settings | `MotorService.motorNameToSettingsSubject` | per `motorName` |
| Position | `MotorService.motorNameToPositionSubject` | per `motorName` |
| Current | `MotorService.motorNameToCurrentSubject` | per `motorName` |

### 7.4 Other domain state

| Domain | Subject | Service |
|---|---|---|
| Poses | `posesSubject` | `PoseService` |
| Personalities | `personalitiesSubject` | `VoiceAssistantService` |
| Chats | `chatSubject` | `ChatService` |
| Chat messages | `messagesSubjectFromChatId` | `ChatService` |
| Camera settings | `cameraSettings` | `CameraService` |
| Bricklets | `brickletSubject` | `BrickletService` |

### 7.5 Persistence outside services

| Key | Location | Purpose |
|---|---|---|
| `voice-assistant-tab` | `localStorage` | Last VA tab |
| Sidebar selection | component state | Navigation highlight |

---

## 8. Error Handling Patterns

| Layer | Behavior on failure |
|---|---|
| `UtilService.createResultObservable` | `console.log(err)` + propagate via `ReplaySubject.error` |
| `CerebraErrorHandler` | Global uncaught errors → `console.log` only |
| HTTP 500 (Camera, VA) | `catchError` → `throwError`, logged to console |
| HTTP 500 (Bricklet, RGB button) | MatSnackBar error toast |
| ROS service failure | Callback error / `subscribe.error` → snackbar or state revert |
| ROS disconnected | `console.error("ROS is not connected.")`, no publish |
| Invalid route param | `jointGuard` / `motorGuard` redirect to default route |

---

## 9. Key Source Files (Test Anchors)

| Concern | Path |
|---|---|
| Routes | `src/app/app-routing.module.ts` |
| API wrapper | `src/app/shared/services/api.service.ts` |
| URL constants | `src/app/shared/services/url.constants.ts` |
| Program lifecycle | `src/app/shared/services/program.service.ts` |
| ROS bridge | `src/app/shared/services/ros-service/ros.service.ts` |
| Blockly workspace | `src/app/program/.../program-workspace/program-workspace.component.ts` |
| Blockly toolbox | `src/app/program/.../program-manager/blockly.ts` |
| Program UI | `src/app/program/.../program-splitscreen/program-splitscreen.component.ts` |
| Console | `src/app/program/.../console/console.component.ts` |
| Save guard | `src/app/security/save-confirmation.guard.ts` |
| Execution state type | `src/app/shared/types/program-state.ts` |
| Log line type | `src/app/shared/types/program-log-line.ts` |
