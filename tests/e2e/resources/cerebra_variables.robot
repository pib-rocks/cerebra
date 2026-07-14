*** Variables ***
${BASE_URL}         http://127.0.0.1
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

&{MOCK_PROGRAMS_LIST}           url=**/api/program
...                             statusCode=200
...                             contentType=application/json
...                             body={"programs":[{"name":"Test Program","programNumber":"1"}]}

&{MOCK_POSE_LIST}               url=**/api/pose
...                             statusCode=200
...                             contentType=application/json
...                             body={"poses":[{"name":"Test Pose","poseId":"pose-1","deletable":true,"active":true}]}

&{MOCK_CAMERA_SETTINGS}         url=**/api/camera-settings
...                             statusCode=200
...                             contentType=application/json
...                             body={"resolution":"640x480","refeshRate":1,"qualityFactor":80,"resX":640,"resY":480,"isActive":false}

&{MOCK_BUTTON_PROGRAMS}         url=**/api/button-programs
...                             statusCode=200
...                             contentType=application/json
...                             body={"buttonPrograms":[{"brickletNumber":1,"programNumber":"1"}]}

&{MOCK_BRICKLETS_RGB}           url=**/api/bricklet
...                             statusCode=200
...                             contentType=application/json
...                             body={"bricklets":[{"brickletNumber":1,"uid":"abc","type":"RGB LED Button Bricklet"}]}

&{MOCK_BRICKLETS_HARDWARE}     url=**/api/bricklet
...                             statusCode=200
...                             contentType=application/json
...                             body={"bricklets":[{"brickletNumber":1,"uid":null,"type":"RGB LED Button Bricklet"}]}

&{MOCK_BRICKLET_PUT_500}        url=**/api/bricklet/*
...                             statusCode=500
...                             contentType=application/json
...                             body={"error":"Internal Server Error"}
