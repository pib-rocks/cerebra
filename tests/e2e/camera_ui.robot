*** Settings ***
Documentation    UC-CAM-* camera UI scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Browser Session
Suite Teardown   Close Cerebra Application
Test Tags        camera    e2e

*** Test Cases ***
UC-CAM-001 Camera Page Loads With Placeholder
    [Documentation]    Given /camera When CameraComponent initializes Then preview area is visible.
    Mock Camera Settings
    Navigate To Route    ${CAMERA_ROUTE}
    Location Should Be Route    ${CAMERA_ROUTE}
    Wait For Elements State    css=app-camera    visible    timeout=${DEFAULT_TIMEOUT}

UC-CAM-004 Camera Settings Controls Visible
    [Documentation]    Resolution and tuning controls are present on camera page.
    Mock Camera Settings
    Navigate To Route    ${CAMERA_ROUTE}
    Element By Data Test Should Be Visible    TGL_Camera_On_Off
