*** Settings ***
Documentation    UC-BLY-* Blockly editor E2E scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Cerebra Application
Suite Teardown   Close Cerebra Application
Test Tags        blockly    e2e

*** Test Cases ***
UC-BLY-001 Load Workspace From Saved Code
    [Documentation]    Given programCodeResolver returned codeVisual When ngAfterViewInit runs Then workspace renders.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    ${block_count}=    Get Element Count    css=#blocklyDiv .blocklyDraggable
    Should Be Equal As Numbers    ${block_count}    ${0}

UC-BLY-002 Add Move Motor Block From Toolbox
    [Documentation]    When user adds move_motor from Motoric skills Then workspace contains the block.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Mock Program Code Put    ${PROGRAM_NUMBER}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Open Blockly Toolbox Category    Motoric skills
    Add First Flyout Block To Workspace
    ${block_count}=    Get Element Count    css=#blocklyDiv .blocklyDraggable
    Should Be True    ${block_count} > 0

UC-BLY-006 Run Program Opens Split Mode
    [Documentation]    When user clicks Run Then save occurs and split mode shows Python + console.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Mock Program Code Put    ${PROGRAM_NUMBER}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Click Run Program Button
    Click Split Screen Toggle
    Python Code Area Should Be Visible
    Console Area Should Be Visible

UC-BLY-004 Save Program After Blockly Edit
    [Documentation]    When workspace changes Then save button becomes active and persists code.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Mock Program Code Put    ${PROGRAM_NUMBER}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Open Blockly Toolbox Category    Motoric skills
    Add First Flyout Block To Workspace
    Wait For Elements State    css=[data-test="BTN_Program_Save"]:not([disabled])    visible    timeout=${DEFAULT_TIMEOUT}
    Click Save Program Button

UC-BLY-011 Program Console Input Visible In Split Mode
    [Documentation]    Console stdin textarea is available when split mode is active.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Click Split Screen Toggle
    Program Input Area Should Be Visible

*** Keywords ***
Add First Flyout Block To Workspace
    [Documentation]    Drag the first block from the open Blockly flyout into the workspace.
    Wait For Elements State    css=.blocklyFlyout    visible    timeout=${DEFAULT_TIMEOUT}
    ${flyout_block}=    Get Element    css=.blocklyFlyout .blocklyDraggable >> nth=0
    ${workspace}=    Get Element    css=#blocklyDiv .blocklyBlockCanvas
    Drag And Drop    ${flyout_block}    ${workspace}
    Sleep    500ms

Get Element Count
    [Arguments]    ${selector}
    ${elements}=    Get Elements    ${selector}
    ${count}=    Get Length    ${elements}
    RETURN    ${count}

Location Should Be Route
    [Arguments]    ${expected_path}
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}

Element By Data Test Should Be Visible
    [Arguments]    ${data_test_value}
    Wait For Elements State    css=[data-test="${data_test_value}"]    visible    timeout=${DEFAULT_TIMEOUT}
