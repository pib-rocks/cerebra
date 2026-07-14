*** Settings ***
Documentation    EC-HTTP-* and EC-ROS-* edge case scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Browser Session
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
    Mock Bricklets For Hardware Id
    Mock Bricklet Put Http 500
    Navigate To Route    ${HARDWARE_IDS_ROUTE}
    Wait For Elements State    css=app-hardware-id    visible    timeout=${DEFAULT_TIMEOUT}
    Fill Text    css=[data-test="TXT_Bricklet_UID_1"]    abc12
    Click Element By Data Test    BTN_Update_bricklet_UIDs
    Snackbar Should Contain Text    Error! IDs could not be set.

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
    Console Area Should Be Visible
