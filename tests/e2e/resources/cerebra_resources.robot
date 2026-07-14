*** Settings ***
Documentation    Shared keywords and variables for Cerebra frontend E2E tests.
Library          Browser
Resource         cerebra_variables.robot

*** Keywords ***
Open Cerebra Application
    [Documentation]    Launch browser and navigate to the Cerebra base URL.
    New Browser    ${BROWSER}    headless=${HEADLESS}
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page    ${BASE_URL}
    Wait For Load State    networkidle    timeout=${DEFAULT_TIMEOUT}

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
    [Documentation]    Register a Playwright route mock returning a JSON body string.
    Route    ${url_pattern}    ${method}    {"status": ${status}, "body": ${body_string}}

Mock Api Http 500
    [Arguments]    ${method}    ${url_pattern}
    Route    ${url_pattern}    ${method}    {"status": 500, "body": {"error": "Internal Server Error"}}

Mock Programs List
    [Documentation]    Mock GET /api/program with a deterministic program list.
    Route    **/api/program    GET    {"status": 200, "body": {"programs": [{"name": "Test Program", "programNumber": "1"}]}}

Mock Program Code
    [Arguments]    ${program_number}    ${code_visual}={}
    Route    **/api/program/${program_number}/code    GET    {"status": 200, "body": {"codeVisual": "${code_visual}"}}

Mock Program Code Put
    [Arguments]    ${program_number}
    Route    **/api/program/${program_number}/code    PUT    {"status": 200, "body": {"codeVisual": "{}"}}

Mock Pose List
    Route    **/api/pose    GET    {"status": 200, "body": {"poses": [{"name": "Test Pose", "poseId": "pose-1", "deletable": true, "active": true}]}}

Wait For Blockly Workspace
    [Documentation]    Wait until Blockly workspace SVG is rendered in #blocklyDiv.
    Wait For Elements State    css=#blocklyDiv .blocklySvg    visible    timeout=${DEFAULT_TIMEOUT}

Open Blockly Toolbox Category
    [Arguments]    ${category_label}
    [Documentation]    Click a Blockly toolbox category by its visible label text.
    Click    css=.blocklyTreeRow >> text=${category_label}

Drag Blockly Block From Flyout
    [Arguments]    ${block_type}
    [Documentation]    Drag a block type from the open flyout into the workspace.
    ${flyout_block}=    Get Element    css=.blocklyFlyout .blocklyDraggable[data-id]:has(.blocklyText)
    Drag And Drop    ${flyout_block}    css=#blocklyDiv .blocklyBlockCanvas

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
