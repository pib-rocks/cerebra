# Cerebra Frontend Use Cases (Test Basis)

> Branch baseline: `PR-1453`  
> Format: Gherkin (Given-When-Then)  
> Purpose: BDD scenarios for Cypress / Playwright / Robot Framework generation.

---

## Conventions

| Tag | Meaning |
|---|---|
| `@route` | Angular route path |
| `@api` | REST call via `ApiService` (`/api` prefix) |
| `@ros` | ROSBridge WebSocket service or topic |
| `@state` | Observable / component state assertion |

**Default preconditions unless stated:**
- User is authenticated (no auth layer in frontend)
- Flask backend reachable at `/api`
- ROSBridge reachable at `ws://{host}:9090`

---

## 1. Navigation & Routing

### UC-NAV-001: Default landing page

```gherkin
Feature: Default navigation

  Scenario: Open root URL
    Given the user navigates to "/"
    When the router resolves
    Then the URL is "/joint-control/head"
    And JointControlCoreComponent is displayed
```

### UC-NAV-002: Invalid joint name

```gherkin
Feature: Joint route guard

  Scenario: Unknown joint in URL
    Given the user navigates to "/joint-control/invalid-joint"
    When jointGuard evaluates the route
    Then the user is redirected to "/joint-control/head"
```

### UC-NAV-003: Invalid motor name

```gherkin
Feature: Motor route guard

  Scenario: Unknown motor in URL
    Given the user is on route "/joint-control/head"
    When the user navigates to "/joint-control/head/motor/invalid-motor"
    Then motorGuard redirects to the default joint route
```

---

## 2. Joint Control & Motor Movement

### UC-MOTOR-001: View joint motors

```gherkin
Feature: Joint control overview

  Scenario: Display motors for head joint
    Given the user is on route "/joint-control/head"
    When JointControlCoreComponent loads jointResolver data
    Then non-multi motors of the head joint are listed
    And each motor is selectable
```

### UC-MOTOR-002: Move motor via slider

```gherkin
Feature: Manual motor positioning

  Scenario: Set motor position from slider
    Given the user is on route "/joint-control/head/motor/{motor-name}"
    And ROS WebSocket connectionStatus$ is true
    And MotorService exposes position for "{motor-name}"
    When the user moves the position slider to value N
    Then MotorService.setPosition is called with position N * 100
    And @ros POST /apply_joint_trajectory is invoked via RosService
```

### UC-MOTOR-003: Live position update from robot

```gherkin
Feature: Motor position feedback

  Scenario: Position updates from ROS topic
    Given the user is on route "/joint-control/head/motor/{motor-name}"
    And MotorService subscribes to /joint_trajectory
    When a JointTrajectory message arrives for "{motor-name}"
    Then the position slider reflects the updated value (position / 100)
```

### UC-MOTOR-004: Motor settings apply failure

```gherkin
Feature: Motor settings error handling

  Scenario: ROS apply_motor_settings fails
    Given the user changes motor settings for "{motor-name}"
    And RosService.applyMotorSettings returns MotorSettingsError without settingsApplied
    When applySettings error handler runs
    Then MotorService re-publishes previous settings to the observable
    And an error is thrown to the global handler
```

---

## 3. Pose Management

### UC-POSE-001: List poses

```gherkin
Feature: Pose list

  Scenario: Load poses on page open
    Given the user is on route "/pose"
    When PoseComponent initializes
    Then @api GET /pose is called
    And the pose list displays all returned poses
```

### UC-POSE-002: Save current pose

```gherkin
Feature: Save pose

  Scenario: Save robot pose with name
    Given the user is on route "/pose"
    And MotorService tracks current motor positions
    When the user clicks save and enters name "Test Pose"
    Then @api POST /pose is called with { name: "Test Pose", motorPositions: [...] }
    And the new pose appears in the list
    And the pose is selected
```

### UC-POSE-003: Apply pose

```gherkin
Feature: Apply pose

  Scenario: Move robot to saved pose
    Given the user is on route "/pose"
    And pose "Test Pose" exists with poseId P
    And pose P is active (active=true)
    When the user applies pose P
    Then MotorService.setPositions is called with pose motor positions
    And @ros /apply_joint_trajectory is invoked
    And pose P is temporarily deactivated then reactivated after 1s
```

### UC-POSE-004: Apply inactive pose

```gherkin
Feature: Apply pose guard

  Scenario: Cannot apply deactivated pose
    Given pose P has active=false
    When the user triggers applyPose(P)
    Then no motor movement is initiated
```

### UC-POSE-005: Rename pose

```gherkin
Feature: Rename pose

  Scenario: Rename deletable pose
    Given pose P is deletable
    When the user renames P to "New Name"
    Then @api PATCH /pose/{P} is called with { name: "New Name" }
    And the list shows "New Name"
```

### UC-POSE-006: Rename non-deletable pose

```gherkin
Feature: Rename pose restriction

  Scenario: Block rename of system pose
    Given pose P has deletable=false
    When the user attempts rename
    Then no modal opens and no API call is made
```

### UC-POSE-007: Update pose motor positions

```gherkin
Feature: Update pose from current robot state

  Scenario: Overwrite pose with current positions
    Given pose P is deletable or named "Startup/Resting"
    When the user updates pose motor positions
    Then @api PATCH /pose/{P}/motor-positions is called
    And a success snackbar "Pose updated successfully" is shown
```

### UC-POSE-008: Delete pose

```gherkin
Feature: Delete pose

  Scenario: Remove pose from list
    Given pose P exists
    When the user deletes P
    Then @api DELETE /pose/{P} is called
    And P is removed from the UI list
```

---

## 4. Camera Feed

### UC-CAM-001: Show camera placeholder

```gherkin
Feature: Camera preview initial state

  Scenario: Default image before stream
    Given the user is on route "/camera"
    When CameraComponent initializes
    Then the preview shows assets/camera-placeholder.jpg
```

### UC-CAM-002: Start camera stream

```gherkin
Feature: Enable camera

  Scenario: Toggle camera on
    Given the user is on route "/camera"
    And ROS connectionStatus$ is true
    When the user enables the camera toggle
    Then CameraService subscribes to /camera_topic
    And preview image updates to "data:image/jpeg;base64,{frame}"
```

### UC-CAM-003: Camera unavailable message

```gherkin
Feature: Camera error display

  Scenario: Backend sends unavailable marker
    Given camera is active
    When /camera_topic message starts with "Camera not available"
    Then preview shows assets/camera-error-image.svg
```

### UC-CAM-004: Change resolution

```gherkin
Feature: Camera resolution

  Scenario: Set preview size
    Given the user is on route "/camera"
    And camera is active
    When the user selects resolution 640x480
    Then CameraService.setPreviewSize(640, 480) publishes to /size_topic
    And @api PUT /camera-settings persists settings
```

### UC-CAM-005: Change quality / refresh rate

```gherkin
Feature: Camera tuning sliders

  Scenario: Adjust quality factor
    Given the user is on route "/camera"
    When the user moves the quality slider
    Then CameraService.setQualityFactor publishes to /quality_factor_topic

  Scenario: Adjust refresh rate
    When the user moves the refresh rate slider
    Then CameraService.setTimerPeriod publishes to /timer_period_topic
```

### UC-CAM-006: Stop camera on leave

```gherkin
Feature: Camera cleanup

  Scenario: Component destroy stops stream
    Given the user is on route "/camera" with camera active
    When the user navigates away
    Then CameraComponent.ngOnDestroy calls stopCamera()
    And cameraSettings.isActive is set to false
```

---

## 5. Voice Assistant

### UC-VA-001: List personalities

```gherkin
Feature: Voice assistant personalities

  Scenario: Load personality sidebar
    Given the user navigates to "/voice-assistant"
    When VoiceAssistantService initializes
    Then @api GET /voice-assistant/personality is called
    And personalities appear in the sidebar
```

### UC-VA-002: Create personality

```gherkin
Feature: Create personality

  Scenario: Add new personality
    Given the user is on voice assistant page
    When the user creates personality "Helper" with valid form data
    Then @api POST /voice-assistant/personality is called
    And @api POST /voice-assistant/chat creates initial chat
    And personality appears in sidebar
```

### UC-VA-003: Open chat

```gherkin
Feature: Chat navigation

  Scenario: Open chat window
    Given personality P exists with chat C
    When the user navigates to "/voice-assistant/{P}/chat/{C}"
    Then chatResolver loads chat data
    And ChatWindowComponent displays messages from @api GET /voice-assistant/chat/{C}/messages
```

### UC-VA-004: Send chat message (token active)

```gherkin
Feature: Chat messaging

  Scenario: Send message with active Smart API token
    Given the user is on chat route for chat C
    And TokenService.tokenStatus$ is { tokenExists: true, tokenActive: true }
    And chat is listening (getIsListeningObservable returns true)
    When the user types "Hello" and submits
    Then ChatService.sendChatMessage(C, "Hello") calls @ros /send_chat_message
    And input is enabled
```

### UC-VA-005: Chat input disabled without token

```gherkin
Feature: Chat token gate

  Scenario: Input disabled when token inactive
    Given TokenService.tokenStatus$ is { tokenExists: false, tokenActive: false }
    When ChatWindowComponent initializes
    Then chatMessageFormControl is disabled
```

### UC-VA-006: Receive assistant reply

```gherkin
Feature: Live chat messages

  Scenario: New message from ROS topic
    Given chat C message stream is subscribed
    When /chat_messages publishes for chat_id C
    Then ChatService appends message to getChatMessagesObservable(C)
    And ChatWindowComponent displays the new message
```

---

## 6. Smart Connect (Token)

### UC-TOKEN-001: Check token on ROS connect

```gherkin
Feature: Token status initialization

  Scenario: Token check after WebSocket connect
    Given ROS connectionStatus$ emits true
    When TokenService constructor subscription fires
    Then @ros /get_token_exists is called
    And tokenStatus$ emits { tokenExists, tokenActive }
```

### UC-TOKEN-002: Encrypt and store token

```gherkin
Feature: Store Smart API token

  Scenario: Encrypt token via modal
    Given SmartConnect modal is open
    And encrypt form is valid (password >= 8, passwords match)
    When the user submits encrypt
    Then @ros /encrypt_token is called with { token, password }
    And TokenService.checkTokenExists refreshes status
```

### UC-TOKEN-003: Decrypt token

```gherkin
Feature: Activate Smart API token

  Scenario: Decrypt stored token
    Given tokenExists is true and tokenActive is false
    When the user submits decrypt with valid password
    Then @ros /decrypt_token is called
    And tokenActive becomes true
```

### UC-TOKEN-004: Delete token

```gherkin
Feature: Remove Smart API token

  Scenario: Delete stored token
    Given tokenExists is true
    When the user confirms delete
    Then @ros publish /delete_token is invoked
    And tokenStatus$ updates to tokenExists=false
```

---

## 7. System / Hardware IDs

### UC-HW-001: Load bricklets

```gherkin
Feature: Hardware ID page

  Scenario: Display bricklet list
    Given the user is on route "/system/hardware-ids"
    When HardwareIdComponent loads
    Then @api GET /bricklet is called
    And bricklets are displayed with UIDs
```

### UC-HW-002: Set bricklet UIDs

```gherkin
Feature: Assign hardware IDs

  Scenario: Successful UID assignment
    Given the user edits bricklet UIDs
    When the user saves
    Then @api PUT /bricklet/{n} is called twice (temp UID pass, then final UID pass)
    And snackbar "Hardware-IDs successfully set!" is shown

  Scenario: UID assignment failure
    Given the final PUT batch fails with HTTP 500
    Then snackbar "Error! IDs could not be set." is shown
    And previous UIDs remain in UI cache
```

---

## 8. Solid-State Relay (Sidebar)

### UC-SSR-001: Relay availability

```gherkin
Feature: Relay control availability

  Scenario: Relay becomes available
    Given RelayControlComponent is in sidebar
    When /solid_state_relay_state publishes { turned_on: true }
    Then isRelayAvailable is true
    And turnedOn reflects relay state
```

### UC-SSR-002: Toggle relay

```gherkin
Feature: Toggle solid-state relay

  Scenario: Turn relay on
    Given isRelayAvailable is true
    And turnedOn is false
    When the user toggles relay
    Then @ros /set_solid_state_relay_state is called with { turned_on: true }
    And UI shows turnedOn=true

  Scenario: ROS service failure reverts UI
    Given toggle was initiated
    When setSolidStateRelayState returns error
    Then turnedOn reverts to previous state
    And snackbar "Error! SSR could not be set." is shown
```

---

## 9. Program Management (Non-Blockly)

### UC-PROG-001: List programs

```gherkin
Feature: Program manager sidebar

  Scenario: Load program list
    Given the user is on route "/program"
    When ProgramManagerComponent initializes
    Then ProgramService.getAllPrograms calls @api GET /program
    And programs appear in sidebar
```

### UC-PROG-002: Create program

```gherkin
Feature: Create program

  Scenario: Create with valid name
    Given the user opens create program modal
    And name has length >= 2
    When the user confirms
    Then @api POST /program is called with { name }
    And router selects new programNumber
```

### UC-PROG-003: Open program editor

```gherkin
Feature: Open Blockly editor

  Scenario: Navigate to program splitscreen
    Given program P exists
    When the user selects program P
    Then route is "/program/{P}"
    And programCodeResolver loads @api GET /program/{P}/code
    And ProgramSplitscreenComponent receives codeVisual
```

### UC-PROG-004: Rename / delete program

```gherkin
Feature: Program CRUD

  Scenario: Rename program
    When the user renames program P to "New Name"
    Then @api PUT /program/{P} is called with { name: "New Name" }

  Scenario: Delete program
    When the user deletes program P
    Then @api DELETE /program/{P} is called
    And P is removed from sidebar
```

---

## 10. RGB LED Button Mapping

### UC-RGB-001: Load button-program mapping

```gherkin
Feature: RGB LED button configuration

  Scenario: Page initialization
    Given the user is on route "/program/rgb-led-button"
    And bricklets include type "RGB LED Button Bricklet"
    When RgbLedButtonComponent initializes
    Then @api GET /button-programs is called
    And form controls are populated with current programNumber per bricklet
```

### UC-RGB-002: Save mapping

```gherkin
Feature: Update button programs

  Scenario: Successful save
    Given the user changes program assignment for button 1
    When the user saves
    Then @api PUT /button-programs is called with { buttonProgramUpdates: [...] }
    And snackbar "Button programs updated successfully" is shown

  Scenario: Save failure HTTP 500
    When PUT returns error
    Then snackbar "Error updating button programs" is shown
    And form remains dirty
```

---

## 11. Blockly Editor

### UC-BLY-001: Load workspace from saved code

```gherkin
Feature: Blockly workspace initialization

  Scenario: Deserialize saved program
    Given the user is on route "/program/{programNumber}"
    And programCodeResolver returned codeVisual JSON string V
    When ProgramWorkspaceComponent ngAfterViewInit runs
    Then Blockly.serialization.workspaces.load(JSON.parse(V)) is applied
    And blocks from V are visible in workspace
```

### UC-BLY-002: Edit block updates JSON and Python preview

```gherkin
Feature: Blockly edit sync

  Scenario: Add move_motor block
    Given Blockly workspace is loaded
    When the user adds block type "move_motor" from toolbox category "Motoric skills"
    And the user connects required inputs
    Then codeVisualChange emits updated JSON string
    And codePythonChange emits generated Python via pythonGenerator.workspaceToCode
    And ProgramSplitscreenComponent.codeVisualNew is updated
```

### UC-BLY-003: Pose dropdown sync

```gherkin
Feature: Dynamic pose block options

  Scenario: Pose list updates block dropdown
    Given workspace contains move_to_pose block
    When PoseService publishes poses [{ name: "Wave", poseId: "abc" }]
    Then Blockly.Blocks["move_to_pose"].getPoses returns [["Wave", "abc"]]
    And workspace reloads current codeVisual
```

### UC-BLY-004: Save program code

```gherkin
Feature: Persist Blockly workspace

  Scenario: Manual save
    Given codeVisualNew differs from codeVisualOld
    When the user clicks save
    Then @api PUT /program/{programNumber}/code is called with { codeVisual: codeVisualNew }
    And codeVisualOld is updated to match codeVisualNew
    And save button shows inactive state
```

### UC-BLY-005: Unsaved changes guard

```gherkin
Feature: Leave route with unsaved Blockly changes

  Scenario: User chooses Save on navigation
    Given codeVisualNew != codeVisualOld
    When the user navigates away from "/program/{programNumber}"
    Then SaveConfirmationGuard opens modal "Save your changes?"
    When the user clicks "Save"
    Then saveCode() is called before navigation proceeds

  Scenario: User chooses Don't Save
    When the user clicks "Don't Save"
    Then navigation proceeds without PUT /code

  Scenario: User cancels navigation
    When the user clicks Cancel
    Then navigation is blocked (canDeactivate returns false)
```

### UC-BLY-006: Run program

```gherkin
Feature: Execute Blockly program

  Scenario: Run saves and starts execution
    Given the user is on route "/program/{programNumber}"
    And executionState is NOT_STARTED
    When the user clicks Run
    Then saveCode() persists codeVisual via PUT /code
    And inSplitMode becomes true (Python + console visible)
    And ProgramService.runProgram is called
    And @state executionState transitions STARTING → RUNNING
    And @ros /proxy_run_program_start is called with { program_number }
    And generated Python is NOT sent in the ROS request
```

### UC-BLY-007: Stop running program

```gherkin
Feature: Stop Blockly execution

  Scenario: Stop while running
    Given executionState is RUNNING
    When the user clicks Run/Stop button
    Then ProgramService.terminateProgram cancels ROS goal
    And @state executionState becomes INTERRUPTED
    And console shows "Program execution has been interrupted by the user."
```

### UC-BLY-008: Program finishes successfully

```gherkin
Feature: Successful program completion

  Scenario: Exit code zero
    Given executionState is RUNNING
    When ROS result exit_code is 0
    Then executionState becomes FINISHED_SUCCESSFUL
    And console shows "Program has finished successfully (exit code: 0)"
    And stdin textarea is hidden
```

### UC-BLY-009: Program finishes with error

```gherkin
Feature: Failed program completion

  Scenario: Non-zero exit code
    Given executionState is RUNNING
    When ROS result exit_code is 1
    Then executionState becomes FINISHED_ERROR
    And console shows "Program has finished with errors (exit code: 1)"
```

### UC-BLY-010: Console output coloring

```gherkin
Feature: Console log stream classification

  Scenario: Stderr line shown as error styling
    Given executionState is RUNNING
    When feedback output_lines contains { content: "[INFO] ...", is_stderr: true }
    Then ProgramLogLine.isError is true
    And console renders line with CSS class "stderr" (pink/red)

  Scenario: Stdout line shown as normal styling
    When output_lines contains { content: "...", is_stderr: false }
    Then line uses CSS class "stdout" (white)
```

### UC-BLY-011: Program stdin input

```gherkin
Feature: Interactive program input

  Scenario: Send stdin while running
    Given executionState is RUNNING
    And mpid is assigned from first feedback
    When the user types "42" in console input and submits
    Then @ros publish /program_input { input: "42", mpid }
    And log line with hasInput=true is appended
```

### UC-BLY-012: Connect motor block and run

```gherkin
Feature: Motor block execution path

  Scenario: move_motor block in workspace
    Given Blockly workspace is loaded
    And user adds "move_motor" block with motor THUMB_LEFT_STRETCH and position 100
    When the user clicks Run
    Then codeVisual JSON containing move_motor block is saved via PUT /code
    And @ros /proxy_run_program_start sends program_number only
    And backend (out of frontend scope) interprets saved codeVisual at runtime
```

### UC-BLY-013: move_to_pose block

```gherkin
Feature: Pose block in workspace

  Scenario: Pose block uses dynamic dropdown
    Given poses exist in PoseService
    And move_to_pose block selects pose "Wave"
    When the user runs the program
    Then saved codeVisual JSON includes POSE field "abc"
```

### UC-BLY-014: System run_script block

```gherkin
Feature: SSH run_script block

  Scenario: run_script with default localhost
    Given workspace contains run_script block with script text
    When Python preview is generated
    Then preview includes SSH connection logic
    And tooltip documents SSH_HOST Docker resolution (upstream pib-blockly)
```

---

## 12. Edge Cases & Failure Scenarios

### EC-HTTP-001: REST API HTTP 500

```gherkin
Feature: HTTP 500 error handling

  Scenario: Program list fetch fails
    Given @api GET /program returns HTTP 500
    When ProgramService.getAllPrograms is invoked
    Then UtilService.createResultObservable logs error to console
    And observable emits error to subscriber
    And no global user toast is shown (ProgramService)

  Scenario: Camera settings PUT fails
    Given @api PUT /camera-settings returns HTTP 500
    Then CameraService catchError logs error
    And no UI state rollback is implemented

  Scenario: Personality create fails
    Given @api POST /voice-assistant/personality returns HTTP 500
    Then VoiceAssistantService catchError logs error
    And personality is not added to sidebar

  Scenario: Bricklet UID update fails
    Given @api PUT /bricklet/{n} returns HTTP 500 on final pass
    Then MatSnackBar shows "Error! IDs could not be set."
```

### EC-ROS-001: WebSocket disconnect

```gherkin
Feature: ROSBridge connection loss

  Scenario: WebSocket closes during session
    Given ROS was connected (connectionStatus$ was true)
    When ros emits "close"
    Then connectionStatus$ emits false
    And subsequent CameraService.setPreviewSize logs "ROS is not connected."
    And TokenService does not re-check token until reconnect

  Scenario: WebSocket error on connect
    When ros emits "error"
    Then connectionStatus$ emits false
    And topics/services are not initialized
```

### EC-ROS-002: Run program service rejection

```gherkin
Feature: Program start failure

  Scenario: proxy_run_program_start fails
    Given executionState is STARTING
    When RosService.runProgram rejects with error
    Then runProgram observable errors
    And executionState may remain STARTING (no explicit reset in ProgramService)
```

### EC-ROS-003: Motor command while disconnected

```gherkin
Feature: Motor movement without ROS

  Scenario: setPosition when ROS disconnected
    Given connectionStatus$ is false
    When MotorService.setPositions is called
    Then RosService.applyJointTrajectory may fail or not complete
    And UI slider may not reflect intended position
```

### EC-BLY-001: Invalid workspace JSON

```gherkin
Feature: Corrupt codeVisual

  Scenario: Load malformed JSON
    Given programCodeResolver returns codeVisual "{ invalid json"
    When ProgramWorkspaceComponent sets workspaceContent
    Then JSON.parse throws
    And CerebraErrorHandler logs the error
    And workspace may fail to render blocks
```

### EC-BLY-002: Empty workspace run

```gherkin
Feature: Run empty program

  Scenario: Run with empty workspace
    Given codeVisual is "{}"
    When the user clicks Run
    Then PUT /code saves empty workspace
    And @ros run still invoked with program_number
    And backend execution result determines FINISHED_SUCCESSFUL or FINISHED_ERROR
```

### EC-BLY-003: Run while already starting

```gherkin
Feature: Double run click

  Scenario: Click run during STARTING
    Given executionState is STARTING
    When the user clicks Run again
    Then runProgram returns early without second ROS call
```

### EC-BLY-004: Provide input without mpid

```gherkin
Feature: Stdin before mpid assigned

  Scenario: Input before first feedback
    Given executionState is STARTING
    And programNumberToMpid has no entry
    When provideProgramInput is called
    Then Error is thrown: "no mpid associated with program"
```

### EC-BLY-005: Pose block with no poses

```gherkin
Feature: Empty pose list

  Scenario: No poses in database
    Given PoseService returns empty list
    When Blockly workspace initializes
    Then move_to_pose dropdown shows ["no pose available", "NO POSE"]
```

### EC-NAV-001: Host IP unavailable

```gherkin
Feature: IP retriever failure

  Scenario: host-ip endpoint fails
    Given @api GET /host-ip returns HTTP 500
    When IpRetrieverComponent loads
    Then error is logged to console
    And hostIp remains empty string
```

### EC-TOKEN-001: Chat blocked without token

```gherkin
Feature: Voice assistant degraded mode

  Scenario: Token never activated
    Given tokenExists=false
    When user opens chat
    Then message input remains disabled
    And sendChatMessage cannot be triggered from UI
```

---

## 13. Cross-Feature Integration Scenarios

### INT-001: Pose used in Blockly then applied manually

```gherkin
Feature: Pose ↔ Blockly integration

  Scenario: Pose saved then available in Blockly
    Given user saves pose "Wave" on /pose
    When user opens /program/{n} and adds move_to_pose block
    Then dropdown includes "Wave"
```

### INT-002: RGB button triggers mapped program

```gherkin
Feature: Hardware button → program (frontend config only)

  Scenario: Map button to program
    Given user maps bricklet 1 to program P on /program/rgb-led-button
    When mapping is saved via PUT /button-programs
    Then physical button press triggers backend (out of frontend scope)
    And frontend only verifies persisted mapping via GET
```

### INT-003: Smart Connect enables chat

```gherkin
Feature: Token gates voice assistant chat

  Scenario: End-to-end chat enablement
    Given ROS connected and token stored but inactive
    When user decrypts token via Smart Connect
    Then tokenActive becomes true
    And chat input on /voice-assistant/{P}/chat/{C} becomes enabled
```

---

## 14. Test Selectors & Anchors

| Element | Selector / ID | Component |
|---|---|---|
| Program console input | `#program-input-area` | ConsoleComponent |
| Program console area | `#console-area` | ConsoleComponent |
| Blockly workspace | `#blocklyDiv` | ProgramWorkspaceComponent |
| Run/Stop button | assets program-run icons | ProgramSplitscreenComponent |

---

## 15. Out-of-Scope (Backend / Hardware)

Document for test planning only — not validated by frontend alone:

- Python generation from `codeVisual` at runtime
- Subprocess stdout/stderr routing (`is_stderr` semantics)
- Physical motor movement confirmation
- Tinkerforge button press detection
- Camera hardware availability
- LLM response content in voice assistant
