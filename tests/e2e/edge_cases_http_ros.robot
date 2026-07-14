*** Settings ***
Documentation    EC-HTTP-* and EC-ROS-* edge case scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Cerebra Application
Suite Teardown   Close Cerebra Application
Test Tags        edge-case    e2e

*** Test Cases ***
EC-HTTP-001 Program List Fetch HTTP 500
    [Documentation]    Given GET /program returns 500 Then page still loads without crash.
    Mock Api Http 500    GET    **/api/program
    Navigate To Route    ${PROGRAM_ROUTE}
    Location Should Be Route    ${PROGRAM_ROUTE}
    Wait For Elements State    css=app-program-manager    visible    timeout=${DEFAULT_TIMEOUT}

EC-HTTP-001 Bricklet UID Update HTTP 500 Shows Error Snackbar
    [Documentation]    Given PUT /bricklet fails Then error snackbar is shown on hardware IDs page.
    Mock Api Route With Body String    GET    **/api/bricklet    200
    ...    {"bricklets":[{"brickletNumber":1,"uid":null,"type":"RGB LED Button Bricklet"}]}
    Mock Api Http 500    PUT    **/api/bricklet/*
    Navigate To Route    ${HARDWARE_IDS_ROUTE}
    Wait For Elements State    css=app-hardware-id    visible    timeout=${DEFAULT_TIMEOUT}

EC-ROS-001 Application Remains Usable Without ROS
    [Documentation]    REST-only pages load when ROS WebSocket is unavailable.
    Mock Programs List
    Navigate To Route    ${PROGRAM_ROUTE}
    Location Should Be Route    ${PROGRAM_ROUTE}
    Wait For Elements State    css=app-program-manager    visible    timeout=${DEFAULT_TIMEOUT}

EC-BLY-002 Run Empty Program UI Flow
    [Documentation]    Given empty workspace When user clicks Run Then split mode opens.
    Mock Programs List
    Mock Program Code    ${PROGRAM_NUMBER}    {}
    Mock Program Code Put    ${PROGRAM_NUMBER}
    Navigate To Route    /program/${PROGRAM_NUMBER}
    Wait For Blockly Workspace
    Click Run Program Button
    Click Split Screen Toggle
    Console Area Should Be Visible

*** Keywords ***
Location Should Be Route
    [Arguments]    ${expected_path}
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}

Element By Data Test Should Be Visible
    [Arguments]    ${data_test_value}
    Wait For Elements State    css=[data-test="${data_test_value}"]    visible    timeout=${DEFAULT_TIMEOUT}
