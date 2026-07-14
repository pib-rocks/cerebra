*** Settings ***
Documentation    UC-POSE-* pose management scenarios from frontend_use_cases.md
Resource         resources/cerebra_resources.robot
Suite Setup      Open Browser Session
Suite Teardown   Close Cerebra Application
Test Tags        pose    e2e

*** Test Cases ***
UC-POSE-001 List Poses On Page Open
    [Documentation]    Given /pose When PoseComponent initializes Then GET /pose populates list.
    Mock Pose List
    Navigate To Route    ${POSE_ROUTE}
    Location Should Be Route    ${POSE_ROUTE}
    Element By Data Test Should Be Visible    BTN_Pose_Select_Test Pose

UC-POSE-002 Save Current Pose Button Visible
    [Documentation]    Save pose control is available on pose page.
    Mock Pose List
    Navigate To Route    ${POSE_ROUTE}
    Element By Data Test Should Be Visible    BTN_Save_pose

UC-POSE-008 Delete Pose Control Present
    [Documentation]    Delete button is rendered for deletable poses.
    Mock Pose List
    Navigate To Route    ${POSE_ROUTE}
    Element By Data Test Should Be Visible    BTN_Pose_Delete_Test Pose
