*** Settings ***
Documentation    UC-CAM-* camera UI scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Cerebra Application
Suite Teardown   Close Cerebra Application
Test Tags        camera    e2e

*** Test Cases ***
UC-CAM-001 Camera Page Loads With Placeholder
    [Documentation]    Given /camera When CameraComponent initializes Then preview area is visible.
    Mock Api Route With Body String    GET    **/api/camera-settings    200
    ...    {"resolution":"640x480","refeshRate":1,"qualityFactor":80,"resX":640,"resY":480,"isActive":false}
    Navigate To Route    ${CAMERA_ROUTE}
    Location Should Be Route    ${CAMERA_ROUTE}
    Wait For Elements State    css=app-camera    visible    timeout=${DEFAULT_TIMEOUT}

UC-CAM-004 Camera Settings Controls Visible
    [Documentation]    Resolution and tuning controls are present on camera page.
    Mock Api Route With Body String    GET    **/api/camera-settings    200
    ...    {"resolution":"640x480","refeshRate":1,"qualityFactor":80,"resX":640,"resY":480,"isActive":false}
    Navigate To Route    ${CAMERA_ROUTE}
    Element By Data Test Should Be Visible    TGL_Camera_On_Off

*** Keywords ***
Location Should Be Route
    [Arguments]    ${expected_path}
    ${url}=    Get Url
    Should Contain    ${url}    ${expected_path}

Element By Data Test Should Be Visible
    [Arguments]    ${data_test_value}
    Wait For Elements State    css=[data-test="${data_test_value}"]    visible    timeout=${DEFAULT_TIMEOUT}
