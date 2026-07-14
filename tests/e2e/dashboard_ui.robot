*** Settings ***
Documentation    UC-MOTOR-001 joint control UI scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Cerebra Application
Suite Teardown   Close Cerebra Application
Test Tags        dashboard    joint-control    e2e

*** Test Cases ***
UC-MOTOR-001 View Joint Motors For Head
    [Documentation]    Given route /joint-control/head Then motors are listed and selectable.
    Navigate To Route    ${JOINT_CONTROL_HEAD_URL}
    Location Should Be Route    ${JOINT_CONTROL_HEAD_URL}
    Wait For Elements State    css=app-joint-control-core    visible    timeout=${DEFAULT_TIMEOUT}

UC-NAV-001 Sidebar Joint Control Link
    [Documentation]    Joint control navigation link is visible from default landing page.
    Navigate To Route    ${JOINT_CONTROL_HEAD_URL}
    Element By Data Test Should Be Visible    LNK_Joint_Control

UC-PROG-001 Program Navigation Link Visible
    [Documentation]    Program tab link is reachable from joint control view.
    Navigate To Route    ${JOINT_CONTROL_HEAD_URL}
    Click Element By Data Test    LNK_Program
    Location Should Be Route    ${PROGRAM_ROUTE}

*** Keywords ***
Location Should Be Route
    [Arguments]    ${expected_path}
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}
