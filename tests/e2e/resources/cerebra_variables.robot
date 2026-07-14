*** Variables ***
${BASE_URL}         http://127.0.0.1:4200
${BROWSER}          chromium
${HEADLESS}         ${True}
${DEFAULT_TIMEOUT}  30s

${JOINT_CONTROL_HEAD_URL}       /joint-control/head
${PROGRAM_ROUTE}                /program
${POSE_ROUTE}                   /pose
${CAMERA_ROUTE}                 /camera
${HARDWARE_IDS_ROUTE}           /system/hardware-ids
${RGB_BUTTON_ROUTE}             /program/rgb-led-button

${PROGRAM_NUMBER}               1
