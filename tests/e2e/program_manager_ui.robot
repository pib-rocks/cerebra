*** Settings ***
Documentation    UC-PROG-* program manager scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Cerebra Application
Suite Teardown   Close Cerebra Application
Test Tags        program    e2e

*** Test Cases ***
UC-PROG-001 Load Program List
    [Documentation]    Given /program When ProgramManagerComponent loads Then GET /program populates sidebar.
    Mock Programs List
    Navigate To Route    ${PROGRAM_ROUTE}
    Location Should Be Route    ${PROGRAM_ROUTE}
    Element By Data Test Should Be Visible    BTN_Test Program

UC-PROG-003 Open Program Editor
    [Documentation]    Given program exists When user selects program Then route is /program/{n} and Blockly loads.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Mock Program Code Put    ${PROGRAM_NUMBER}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Location Should Be Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Get Element By Id Should Be Visible    blocklyDiv

UC-PROG-004 Save Button Disabled When No Changes
    [Documentation]    Save button is inactive when codeVisualNew equals codeVisualOld.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Element By Data Test Should Be Disabled    BTN_Program_Save

UC-RGB-001 RGB LED Button Page Loads
    [Documentation]    Given /program/rgb-led-button Then button program form is shown.
    Mock Api Route With Body String    GET    **/api/button-programs    200
    ...    {"buttonPrograms":[{"brickletNumber":1,"programNumber":"1"}]}
    Mock Api Route With Body String    GET    **/api/bricklet    200
    ...    {"bricklets":[{"brickletNumber":1,"uid":"abc","type":"RGB LED Button Bricklet"}]}
    Navigate To Route    ${RGB_BUTTON_ROUTE}
    Location Should Be Route    ${RGB_BUTTON_ROUTE}
    Element By Data Test Should Be Visible    BTN_Update_Button_Programs

*** Keywords ***
Location Should Be Route
    [Arguments]    ${expected_path}
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}

Element By Data Test Should Be Disabled
    [Arguments]    ${data_test_value}
    Get Element States    css=[data-test="${data_test_value}"]    contains    disabled

Element By Data Test Should Be Visible
    [Arguments]    ${data_test_value}
    Wait For Elements State    css=[data-test="${data_test_value}"]    visible    timeout=${DEFAULT_TIMEOUT}
