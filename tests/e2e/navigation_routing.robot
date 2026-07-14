*** Settings ***
Documentation    UC-NAV-* navigation and routing scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Browser Session
Suite Teardown   Close Cerebra Application
Test Tags        navigation    e2e

*** Test Cases ***
UC-NAV-001 Default Landing Page
    [Documentation]    Given the user navigates to "/" When the router resolves Then URL is /joint-control/head
    Navigate To Route    /
    Location Should Be Route    ${JOINT_CONTROL_HEAD_URL}

UC-NAV-002 Invalid Joint Name Redirects To Head
    [Documentation]    Given unknown joint in URL Then jointGuard redirects to /joint-control/head
    Navigate To Route    /joint-control/invalid-joint
    Location Should Be Route    ${JOINT_CONTROL_HEAD_URL}

UC-NAV-003 Navigate To Program Manager
    [Documentation]    User can reach /program from application shell.
    Navigate To Route    ${PROGRAM_ROUTE}
    Location Should Be Route    ${PROGRAM_ROUTE}
    Element By Data Test Should Be Visible    LNK_Programs

UC-NAV-003 Navigate To Pose Page
    Navigate To Route    ${POSE_ROUTE}
    Location Should Be Route    ${POSE_ROUTE}

UC-NAV-003 Navigate To Camera Page
    Navigate To Route    ${CAMERA_ROUTE}
    Location Should Be Route    ${CAMERA_ROUTE}

UC-NAV-003 Navigate To Hardware IDs
    Navigate To Route    ${HARDWARE_IDS_ROUTE}
    Location Should Be Route    ${HARDWARE_IDS_ROUTE}
