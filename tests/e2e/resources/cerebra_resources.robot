*** Settings ***
Documentation    Shared keywords and variables for Cerebra frontend E2E tests.
Library          Browser    jsextension=${CURDIR}/mockUrl.js
Resource         cerebra_variables.robot

*** Keywords ***
Open Browser Session
    [Documentation]    Launch browser with blank page so mocks can be registered before navigation.
    New Browser    ${BROWSER}    headless=${HEADLESS}
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page    about:blank

Close Cerebra Application
    [Documentation]    Close browser and reset session state.
    Close Browser    ALL

Navigate To Route
    [Arguments]    ${route}
    [Documentation]    Navigate to an Angular route relative to BASE_URL.
    Go To    ${BASE_URL}${route}
    Wait For Load State    networkidle    timeout=${DEFAULT_TIMEOUT}

Location Should Be Route
    [Arguments]    ${expected_path}
    [Documentation]    Assert the browser URL path matches the expected Angular route.
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}

Click Element By Data Test
    [Arguments]    ${data_test_value}
    [Documentation]    Click an element located by data-test attribute.
    Click    css=[data-test="${data_test_value}"]

Element By Data Test Should Be Visible
    [Arguments]    ${data_test_value}
    Wait For Elements State    css=[data-test="${data_test_value}"]    visible    timeout=${DEFAULT_TIMEOUT}

Element By Data Test Should Be Disabled
    [Arguments]    ${data_test_value}
    Get Element States    css=[data-test="${data_test_value}"]    contains    disabled

Get Element By Id Should Be Visible
    [Arguments]    ${element_id}
    Wait For Elements State    css=#${element_id}    visible    timeout=${DEFAULT_TIMEOUT}

Mock Api Route With Body String
    [Arguments]    ${method}    ${url_pattern}    ${status}    ${body_string}
    [Documentation]    Register mockUrl response for a URL pattern (method ignored by mockUrl).
    &{mock}=    Create Dictionary
    ...    url=${url_pattern}
    ...    statusCode=${status}
    ...    contentType=application/json
    ...    body=${body_string}
    mockUrl    ${mock}

Mock Api Http 500
    [Arguments]    ${method}    ${url_pattern}
    [Documentation]    Mock HTTP 500 for a URL pattern (method ignored by mockUrl).
    &{mock}=    Create Dictionary
    ...    url=${url_pattern}
    ...    statusCode=500
    ...    contentType=application/json
    ...    body={"error":"Internal Server Error"}
    mockUrl    ${mock}

Mock Programs List
    [Documentation]    Mock GET /api/program with a deterministic program list.
    mockUrl    ${MOCK_PROGRAMS_LIST}

Mock Program Code
    [Arguments]    ${program_number}    ${code_visual}={}
    [Documentation]    Mock GET /api/program/{n}/code.
    &{mock}=    Create Dictionary
    ...    url=**/api/program/${program_number}/code
    ...    statusCode=200
    ...    contentType=application/json
    ...    body={"codeVisual":"${code_visual}"}
    mockUrl    ${mock}

Mock Program Code Put
    [Arguments]    ${program_number}
    [Documentation]    Mock PUT /api/program/{n}/code.
    &{mock}=    Create Dictionary
    ...    url=**/api/program/${program_number}/code
    ...    statusCode=200
    ...    contentType=application/json
    ...    body={"codeVisual":"{}"}
    mockUrl    ${mock}

Mock Pose List
    [Documentation]    Mock GET /api/pose with a deterministic pose list.
    mockUrl    ${MOCK_POSE_LIST}

Mock Camera Settings
    [Documentation]    Mock GET /api/camera-settings with default inactive camera.
    mockUrl    ${MOCK_CAMERA_SETTINGS}

Mock Button Programs And Bricklets
    [Documentation]    Mock GET /api/button-programs and /api/bricklet for RGB LED page.
    mockUrl    ${MOCK_BUTTON_PROGRAMS}
    mockUrl    ${MOCK_BRICKLETS_RGB}

Mock Bricklets For Hardware Id
    [Documentation]    Mock GET /api/bricklet for hardware ID page.
    mockUrl    ${MOCK_BRICKLETS_HARDWARE}

Mock Bricklet Put Http 500
    [Documentation]    Mock bricklet PUT: temp-uid pass succeeds, final pass returns HTTP 500.
    mockBrickletUidPutFinalFails

Snackbar Should Contain Text
    [Arguments]    ${text}
    Wait For Elements State    css=.mat-mdc-snack-bar-container    visible    timeout=${DEFAULT_TIMEOUT}
    ${snackbar_text}=    Get Text    css=.mat-mdc-snack-bar-container
    Should Contain    ${snackbar_text}    ${text}

Wait For Blockly Workspace
    [Documentation]    Wait until Blockly workspace SVG is rendered in #blocklyDiv.
    Wait For Elements State    css=#blocklyDiv .blocklySvg    visible    timeout=${DEFAULT_TIMEOUT}

Open Blockly Toolbox Category
    [Arguments]    ${category_label}
    [Documentation]    Click a Blockly toolbox category by its visible label text.
    Click    css=#blocklyDiv >> .blocklyTreeRow:has-text("${category_label}")

Drag Blockly Block From Flyout
    [Arguments]    ${block_type}
    [Documentation]    Drag a block type from the open flyout into the workspace.
    Wait For Elements State    css=.blocklyFlyout[data-cached-width]    visible    timeout=${DEFAULT_TIMEOUT}
    ${flyout_block}=    Get Element    css=.blocklyFlyout[data-cached-width] .blocklyDraggable >> nth=0
    Set Strict Mode    False
    ${workspace}=    Get Element    css=#blocklyDiv .blocklyBlockCanvas
    Set Strict Mode    True
    Drag And Drop    ${flyout_block}    ${workspace}

Click Run Program Button
    [Documentation]    Click the program run/stop toolbar button.
    Click Element By Data Test    BTN_Program_Run_Stop

Click Save Program Button
    Click Element By Data Test    BTN_Program_Save

Click Split Screen Toggle
    Click Element By Data Test    TGL_Split_Screen

Console Area Should Be Visible
    Get Element By Id Should Be Visible    console-area

Python Code Area Should Be Visible
    Get Element By Id Should Be Visible    python-code-area

Program Input Area Should Be Visible
    Get Element By Id Should Be Visible    program-input-area

Fill Program Console Input
    [Arguments]    ${text}
    Fill Text    css=#program-input-area    ${text}

Submit Program Console Input
    Press Keys    css=#program-input-area    Enter
