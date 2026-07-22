import jsonServer from "json-server";
import mockData from "./json-server-database.json" with {type: "json"};
import Personality from "./dto/personality.mjs";
import CameraSettings from "./dto/camera-settings.mjs";
import Chat from "./dto/chat.mjs";
import Message from "./dto/message.mjs";
import Bricklet from "./dto/bricklet.mjs";
import Motor from "./dto/motor.mjs";
import MotorSettings from "./dto/motorsettings.mjs";
import Program from "./dto/program.mjs";
import AssistantModel from "./dto/assistantmodel.mjs";
import Pose from "./dto/pose.mjs";
import MotorPosition from "./dto/motor-position.mjs";
import ButtonProgram from "./dto/button-program.mjs";
import {createZip} from "./create-zip.mjs";

const server = jsonServer.create();
const router = jsonServer.router(mockData);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

const mockContainers = [
    {
        id: "a1b2c3d",
        name: "flask-app",
        image: "flask_api",
        status: "running",
        health: "healthy",
        startedAt: "2026-07-20T08:00:00Z",
        ports: ["0.0.0.0:5000->5000/tcp"],
    },
    {
        id: "e4f5g6h",
        name: "rosbridge-ws",
        image: "rosbridge-ws",
        status: "running",
        health: "healthy",
        startedAt: "2026-07-20T08:00:05Z",
        ports: ["0.0.0.0:9090->9090/tcp"],
    },
    {
        id: "i7j8k9l",
        name: "ros-motors",
        image: "ros_motors",
        status: "exited",
        health: "unhealthy",
        startedAt: "2026-07-19T12:00:00Z",
        ports: [],
    },
    {
        id: "m0n1o2p",
        name: "pib-blockly-server",
        image: "pib-blockly-server",
        status: "running",
        health: "healthy",
        startedAt: "2026-07-20T08:00:02Z",
        ports: ["0.0.0.0:2442->2442/tcp"],
    },
];

const mockContainerLogs = {
    "flask-app":
        "2026-07-20T08:00:01Z [INFO] Flask app started on 0.0.0.0:5000\n2026-07-20T08:01:00Z [INFO] GET /bricklet 200\n",
    "rosbridge-ws":
        "2026-07-20T08:00:06Z [INFO] Rosbridge websocket listening on 9090\n",
    "ros-motors":
        "2026-07-19T12:00:01Z [ERROR] Tinkerforge connection lost\n2026-07-19T12:00:02Z [INFO] Shutting down\n",
    "pib-blockly-server":
        "2026-07-20T08:00:03Z [INFO] Blockly server ready\n",
};

//getAllPersonalities
server.get("/voice-assistant/personality", (req, res, next) => {
    let response = [];
    mockData.personality.forEach((personality) => {
        response.push(Personality.getPersonality(personality));
    });
    return res.status(200).send({voiceAssistantPersonalities: response});
});

//getPersonalityByPersonalityId
server.get("/voice-assistant/personality/:personalityId", (req, res, next) => {
    const response = mockData.personality.filter(
        (perso) => perso.personalityId == req.params.personalityId,
    );
    if (response[0] == undefined) {
        return res.status(404).send();
    }
    return res.status(200).send(Personality.getPersonality(response[0]));
});

//postPersonality
server.post("/voice-assistant/personality", (req, res, next) => {
    const newPersonality = Personality.newPersonality(
        req.body.name,
        req.body.gender,
        req.body.pauseThreshold,
        req.body.messageHistory,
    );
    mockData.personality.push(newPersonality);
    return res.status(201).send(newPersonality);
});

//putPersonalityByPersonalityId
server.put("/voice-assistant/personality/:personalityId", (req, res, next) => {
    let updated = false;
    mockData.personality.forEach((personality) => {
        if (personality.personalityId == req.params.personalityId) {
            personality.name = req.body.name;
            personality.gender = req.body.gender;
            personality.pauseThreshold = req.body.pauseThreshold;
            personality.description = req.body.description;
            personality.messageHistory = req.body.messageHistory;
            updated = true;
            return res
                .status(200)
                .send(Personality.getPersonality(personality));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//deletePersonalityByPersonalityId
server.delete(
    "/voice-assistant/personality/:personalityId",
    (req, res, next) => {
        const lengPersonality = mockData.personality.length;
        mockData.personality = mockData.personality.filter(
            (perso) => perso.personalityId != req.params.personalityId,
        );
        if (lengPersonality == mockData.personality.length) {
            return res.status(404).json();
        }
        return res.status(204).json();
    },
);

//getAllChats
server.get("/voice-assistant/chat", (req, res, next) => {
    let response = [];
    mockData.chats.forEach((chat) => {
        response.push(Chat.getChat(chat));
    });
    return res.status(200).send({voiceAssistantChats: response});
});

//postChat
server.post("/voice-assistant/chat", (req, res, next) => {
    const newPersonality = Chat.newChat(req.body.topic, req.body.personalityId);
    mockData.chats.push(newPersonality);
    return res.status(201).send(newPersonality);
});

//getChatById
server.get("/voice-assistant/chat/:chatId", (req, res, next) => {
    const response = mockData.chats.filter(
        (chat) => chat.chatId == req.params.chatId,
    );
    if (response[0] == undefined) {
        return res.status(404).send();
    }
    return res.status(200).send(Chat.getChat(response[0]));
});

//putChat
server.put("/voice-assistant/chat/:chatId", (req, res, next) => {
    let updated = false;
    mockData.chats.forEach((chat) => {
        if (chat.chatId == req.params.chatId) {
            chat.topic = req.body.topic;
            chat.personalityId = req.body.personalityId;
            updated = true;
            return res.status(200).send(Chat.getChat(chat));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//deleteChat
server.delete("/voice-assistant/chat/:chatId", (req, res, next) => {
    const lengChats = mockData.chats.length;
    mockData.chats = mockData.chats.filter(
        (chat) => chat.chatId != req.params.chatId,
    );
    if (lengChats == mockData.chats.length) {
        return res.status(404).json();
    }
    return res.status(204).json();
});

//getAllMessagesByChatId
server.get("/voice-assistant/chat/:chatId/messages", (req, res, next) => {
    let response = [];
    mockData.chatMessage.forEach((message) => {
        if (message.chatId == req.params.chatId) {
            response.push(Message.getMessage(message));
        }
    });
    return res.status(200).send({messages: response});
});

//getMessageByChatIdAndMessageId
server.get(
    "/voice-assistant/chat/:chatId/messages/:messageId",
    (req, res, next) => {
        const response = mockData.chatMessage.filter(
            (message) =>
                message.chatId == req.params.chatId &&
                message.messageId == req.params.messageId,
        );
        if (response[0] == undefined) {
            return res.status(404).send();
        }
        return res.status(200).send(Message.getMessage(response[0]));
    },
);

//putMessageByChatId
server.put(
    "/voice-assistant/chat/:chatId/messages/:messageId",
    (req, res, next) => {
        let updated = false;
        mockData.chatMessage.forEach((message) => {
            if (
                message.messageId == req.params.messageId &&
                message.chatId == req.params.chatId
            ) {
                message.timestamp = req.body.timestamp;
                message.isUser = req.body.isUser;
                message.content = req.body.content;
                message.chatId = req.params.chatId;
                updated = true;
                return res.status(200).send(Message.getMessage(message));
            }
        });
        if (!updated) {
            return res.status(404).send();
        }
    },
);

//postMessageByChatId
server.post("/voice-assistant/chat/:chatId/messages", (req, res, next) => {
    const newMessage = Message.newMessage(
        req.body.timestamp,
        req.body.isUser,
        req.body.content,
        req.params.chatId,
    );
    mockData.chatMessage.push(newMessage);
    return res.status(201).send(newMessage);
});

//deleteMessageByChatIdAndMessageId
server.delete(
    "/voice-assistant/chat/:chatId/messages/:messageId",
    (req, res, next) => {
        let remoed = false;
        mockData.chats.forEach((chat) => {
            if (chat.chatId == req.params.chatId) {
                mockData.chatMessage.forEach((message) => {
                    if (message.messageId == req.params.messageId) {
                        mockData.chatMessage = mockData.chatMessage.filter(
                            (message) =>
                                message.messageId != req.params.messageId,
                        );
                        remoed = true;
                        return res.status(204).send();
                    }
                });
            }
        });
        if (remoed == false) {
            return res.status(404).send("No content with the given ids found");
        }
    },
);

//getCameraSettings
server.get("/camera-settings", (req, res, next) => {
    const cameraSettings = mockData.cameraSettings.filter((cam) => cam.id == 1);
    const response = CameraSettings.getCameraSettings(cameraSettings[0]);
    return res.status(200).send(response);
});

//putCameraSettings
server.put("/camera-settings", (req, res, next) => {
    mockData.cameraSettings.forEach((cam) => {
        if (cam.id == 1) {
            cam.resolution = req.body.resolution;
            cam.refeshRate = req.body.refeshRate;
            cam.qualityFactor = req.body.qualityFactor;
            cam.resX = req.body.resX;
            cam.resY = req.body.resY;
            return res.status(200).send(CameraSettings.getCameraSettings(cam));
        } else {
            return res.status(404).send();
        }
    });
});

//getAllBricklets
server.get("/bricklet", (req, res, next) => {
    let response = [];
    mockData.bricklet.forEach((bricklet) => {
        response.push(Bricklet.getBricklet(bricklet));
    });
    return res.status(200).send({bricklets: response});
});

//getBrickletByBrickletNumber
server.get("/bricklet/:brickletNumber", (req, res, next) => {
    const bricklet = mockData.bricklet.filter(
        (bricklet) => bricklet.brickletNumber == req.params.brickletNumber,
    )[0];
    if (bricklet == undefined) {
        return res.status(404).send();
    }
    return res.status(200).send({uid: bricklet.uid});
});

//putBrickletByBrickletNumber
server.put("/bricklet/:brickletNumber", (req, res, next) => {
    let response;
    mockData.bricklet.forEach((brick) => {
        if (brick.brickletNumber == req.params.brickletNumber) {
            brick.uid = req.body.uid;
            response = Bricklet.getBricklet(brick);
        }
    });
    return res.status(200).send(response);
});

//getAllMotors
server.get("/motor", (req, res, next) => {
    let response = [];
    mockData.motors.forEach((motor) => {
        let motorBrickletPin = [];
        mockData.brickletPin.forEach((brickeltPin) => {
            if (brickeltPin.motorId == motor.id) {
                motorBrickletPin.push(brickeltPin);
            }
        });
        let bricklets = [];
        mockData.bricklet.forEach((bricklet) => {
            motorBrickletPin.forEach((motorBrickletPin) => {
                if (motorBrickletPin.brickletId == bricklet.id) {
                    bricklets.push(bricklet);
                }
            });
        });
        response.push(Motor.getMotor(motor, bricklets));
    });
    return res.status(200).send({motors: response});
});

//getMotorByName
server.get("/motor/:motorName", (req, res, next) => {
    let response;
    const motor = mockData.motors.find(
        (motor) => motor.name == req.params.motorName,
    );
    if (motor == undefined) {
        return res.status(404).send();
    }
    let motorBrickletPin = [];
    mockData.brickletPin.forEach((brickeltPin) => {
        if (brickeltPin.motorId == motor.id) {
            motorBrickletPin.push(brickeltPin);
        }
    });
    let bricklets = [];
    mockData.bricklet.forEach((bricklet) => {
        motorBrickletPin.forEach((motorBrickletPin) => {
            if (motorBrickletPin.brickletId == bricklet.id) {
                bricklets.push(bricklet);
            }
        });
    });
    response = Motor.getMotor(motor, bricklets);
    return res.status(200).send(response);
});

//putMotorByName
server.put("/motor/:motorName", (req, res, next) => {
    let updated = false;
    mockData.motors.forEach((motor) => {
        if (motor.name == req.params.motorName) {
            updated = true;
            motor.turnedOn = req.body.turnedOn;
            motor.pulseWidthMin = req.body.pulseWidthMin;
            motor.pulseWidthMax = req.body.pulseWidthMax;
            motor.rotationRangeMin = req.body.rotationRangeMin;
            motor.rotationRangeMax = req.body.rotationRangeMax;
            motor.velocity = req.body.velocity;
            motor.acceleration = req.body.acceleration;
            motor.deceleration = req.body.deceleration;
            motor.period = req.body.period;
            motor.visible = req.body.visible;

            let motorBrickletPin = [];
            mockData.brickletPin.forEach((brickeltPin) => {
                if (brickeltPin.motorId == motor.id) {
                    motorBrickletPin.push(brickeltPin);
                }
            });
            let bricklets = [];
            mockData.bricklet.forEach((bricklet) => {
                motorBrickletPin.forEach((motorBrickletPin) => {
                    if (motorBrickletPin.brickletId == bricklet.id) {
                        bricklets.push(bricklet);
                    }
                });
            });
            motor.bricklet = bricklets;
            return res.status(200).send(Motor.getMotor(motor, bricklets));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//getMotorSettingsByName
server.get("/motor/:motorName/settings", (req, res, next) => {
    let response;
    const motor = mockData.motors.find(
        (motor) => motor.name == req.params.motorName,
    );
    if (motor == undefined) {
        return res.status(404).send();
    }
    response = MotorSettings.getMotorSettings(motor);
    return res.status(200).send(response);
});

//putMotorSettingsByName
server.put("/motor/:motorName/settings", (req, res, next) => {
    let updated = false;
    mockData.motors.forEach((motor) => {
        if (motor.name == req.params.motorName) {
            updated = true;
            motor.turnedOn = req.body.turnedOn;
            motor.pulseWidthMin = req.body.pulseWidthMin;
            motor.pulseWidthMax = req.body.pulseWidthMax;
            motor.rotationRangeMin = req.body.rotationRangeMin;
            motor.rotationRangeMax = req.body.rotationRangeMax;
            motor.velocity = req.body.velocity;
            motor.acceleration = req.body.acceleration;
            motor.deceleration = req.body.deceleration;
            motor.period = req.body.period;
            motor.visible = req.body.visible;
            return res.status(200).send(MotorSettings.getMotorSettings(motor));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//getAllPoses
server.get("/pose", (req, res, next) => {
    const poses = mockData.poses.map((pose) => Pose.getPose(pose));
    return res.status(200).send({poses});
});

//postPose
server.post("/pose", (req, res, next) => {
    const pose = Pose.newPose(req.body.name, req.body.motorPositions);
    mockData.poses.push(pose);
    return res.status(201).send(pose);
});

//renamePose
server.patch("/pose/:poseId", (req, res, next) => {
    const pose = mockData.poses.find(
        (pose) => pose.poseId == req.params.poseId,
    );
    if (!pose) {
        return res.status(404).send();
    }
    pose.name = req.body.name;
    return res.status(200).send(Pose.newPose(pose));
});

//deletePose
server.delete("/pose/:poseId", (req, res, next) => {
    const index = mockData.poses.findIndex(
        (pose) => pose.poseId === req.params.poseId,
    );
    if (index === -1) {
        return res.status(404).send();
    }
    mockData.poses.splice(index, 1);
    return res.status(204).send();
});

//getMotorPositionsByPose
server.get("/pose/:poseId/motor-positions", (req, res, next) => {
    const pose = mockData.poses.find(
        (pose) => pose.poseId == req.params.poseId,
    );
    if (!pose) {
        return res.status(404).send();
    }
    const motorPositions = pose.motorPositions.map((mp) =>
        MotorPosition.getMotorPosition(mp),
    );
    return res.status(200).send({motorPositions});
});

//updatePoseMotorPositions
server.patch("/pose/:poseId/motor-positions", (req, res, next) => {
    const pose = mockData.poses.find(
        (pose) => pose.poseId == req.params.poseId,
    );
    if (!pose) {
        return res.status(404).send();
    }
    pose.motorPositions = req.body.motorPositions;
    return res.status(200).send(Pose.getPose(pose));
});

//getAllPrograms
server.get("/program", (req, res, next) => {
    let response = [];
    mockData.programs.forEach((program) => {
        response.push(Program.getProgram(program));
    });
    return res.status(200).send({programs: response});
});

//postProgram
server.post("/program", (req, res, next) => {
    const newProgram = Program.newProgram(req.body.name, req.body.codeVisual);
    mockData.programs.push(newProgram);
    return res.status(201).send(newProgram);
});

//getProgramByProgramnumber
server.get("/program/:programNumber", (req, res, next) => {
    let response = mockData.programs.find(
        (program) => program.programNumber == req.params.programNumber,
    );
    if (response == undefined) {
        return res.status(404).send();
    }
    return res.status(200).send(Program.getProgram(response));
});

//putProgramByProgramnumber
server.put("/program/:programNumber", (req, res, next) => {
    let updated = false;
    mockData.programs.forEach((program) => {
        if (program.programNumber == req.params.programNumber) {
            program.name = req.body.name;
            updated = true;
            return res.status(200).send(Program.getProgram(program));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//deleteByProgramNumber
server.delete("/program/:programNumber", (req, res, next) => {
    const lengPrograms = mockData.programs.length;
    mockData.programs = mockData.programs.filter(
        (programs) => programs.programNumber != req.params.programNumber,
    );
    if (lengPrograms == mockData.programs.length) {
        return res.status(404).send();
    }
    return res.status(204).send();
});

//getCodeByProgramnumber
server.get("/program/:programNumber/code", (req, res, next) => {
    let response = mockData.programs.find(
        (program) => program.programNumber == req.params.programNumber,
    );
    if (response == undefined) {
        return res.status(404).send();
    }
    response = Program.returnCode(response);
    return res.status(200).send(response);
});

//putCodeByProgramnumber
server.put("/program/:programNumber/code", (req, res, next) => {
    let updated = false;
    mockData.programs.forEach((program) => {
        if (program.programNumber == req.params.programNumber) {
            program.visual = req.body.visual;
            updated = true;
            return res.status(200).send(Program.getProgram(program));
        }
    });
    if (!updated) {
        return res.status(404).send();
    }
});

//getAssistantModel
server.get("/assistant-model", (req, res, next) => {
    let response = [];
    mockData.assistantModel.forEach((model) => {
        response.push(AssistantModel.getAssistantModel(model));
    });
    return res.status(200).send({assistantModels: response});
});

//getAssistantModelById
server.get("/assistant-model/:id", (req, res, next) => {
    let response = mockData.assistantModel.find(
        (assistantModel) => assistantModel.id == req.params.id,
    );
    if (response == undefined) {
        return res.status(404).send();
    }
    return res.status(200).send(response);
});

//getButtonPrograms
server.get("/button-programs", (req, res, next) => {
    let response = [];
    mockData.buttonProgram.forEach((buttonProgram) => {
        response.push(ButtonProgram.getButtonProgram(buttonProgram));
    });
    return res.status(200).send({buttonPrograms: response});
});

//updateButtonPrograms
server.put("/button-programs", (req, res, next) => {
    let updatedButtonPrograms = [];
    req.body.buttonProgramUpdates.forEach((buttonProgram) => {
        let updated = false;
        mockData.buttonProgram.forEach((bp) => {
            if (bp.brickletNumber == buttonProgram.brickletNumber) {
                bp.programNumber = buttonProgram.programNumber;
                updatedButtonPrograms.push(ButtonProgram.getButtonProgram(bp));
                updated = true;
            }
        });
        if (!updated) {
            return res.status(404).send();
        }
    });
    return res.status(200).send({buttonPrograms: updatedButtonPrograms});
});

// System information APIs
server.get("/system/info", (req, res) => {
    return res.status(200).send({
        hostname: "pib-dev",
        os: {
            prettyName: "Debian GNU/Linux 12 (bookworm)",
            versionId: "12",
            id: "debian",
        },
        arch: "aarch64",
        kernel: "Linux version 6.6.0-raspi",
        cpu: {
            model: "Cortex-A76",
            cores: 4,
        },
        memory: {
            totalMb: 8192,
            usedMb: 2450,
            availableMb: 5742,
        },
        temperatureC: 51.2,
        uptimeSeconds: 126540,
        loadAverage: {
            oneMinute: 0.42,
            fiveMinutes: 0.38,
            fifteenMinutes: 0.35,
        },
        hostIp: "192.168.1.42",
    });
});

server.get("/system/containers", (req, res) => {
    return res.status(200).send({containers: mockContainers});
});

server.get("/system/containers/:name/logs", (req, res) => {
    const name = req.params.name;
    const logs = mockContainerLogs[name];
    if (logs === undefined) {
        return res.status(404).send({error: `Container '${name}' not found`});
    }
    return res.status(200).send({name, logs});
});

server.get("/system/bricklets/status", (req, res) => {
    const motorsByBrickletId = {};
    mockData.brickletPin.forEach((pin) => {
        if (!motorsByBrickletId[pin.brickletId]) {
            motorsByBrickletId[pin.brickletId] = [];
        }
        const motor = mockData.motors.find((m) => m.id === pin.motorId);
        motorsByBrickletId[pin.brickletId].push({
            pin: pin.pin,
            motorName: motor?.name || null,
            invert: pin.invert,
            connected: true,
            enabled: true,
            currentMa: 110 + pin.pin,
            position: 0,
            voltageMv: 5200,
        });
    });

    const bricklets = mockData.bricklet.map((bricklet) => {
        const entry = {
            brickletNumber: bricklet.brickletNumber,
            uid: bricklet.uid,
            type: bricklet.type,
            connected: true,
            identity: {
                uid: bricklet.uid,
                hardwareVersion: [2, 0, 0],
                firmwareVersion: [2, 0, 3],
                deviceIdentifier: 2157,
                position: "a",
            },
            servo: null,
            relay: null,
            rgbButton: null,
        };

        if (bricklet.type === "Servo Bricklet") {
            const pins = motorsByBrickletId[bricklet.id] || [];
            entry.servo = {pins, voltageMv: 5200};
        } else if (bricklet.type === "Solid State Relay Bricklet") {
            entry.relay = {turnedOn: false, connected: true};
            entry.identity.deviceIdentifier = 2114;
        } else if (bricklet.type === "RGB LED Button Bricklet") {
            entry.rgbButton = {
                connected: true,
                color: {r: 0, g: 80, b: 255},
                buttonState: "released",
                identity: entry.identity,
            };
            entry.identity.deviceIdentifier = 2118;
        }
        return entry;
    });

    return res.status(200).send({
        bricklets,
        tinkerforgeConnected: true,
    });
});

server.get("/system/diagnostics.zip", (req, res) => {
    const zip = createZip({
        "README.txt":
            "Mock pib diagnostics archive with representative support data.\n",
        "meta.json": JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                source: "cerebra-mock",
                version: 2,
            },
            null,
            2,
        ),
        "system/system-info.json": JSON.stringify(
            {
                hostname: "pib-dev",
                os: {prettyName: "Debian GNU/Linux 12 (bookworm)"},
                arch: "aarch64",
                temperatureC: 51.2,
                hostIp: "192.168.1.42",
                memory: {totalMb: 8192, usedMb: 2450, availableMb: 5742},
            },
            null,
            2,
        ),
        "docker/containers.json": JSON.stringify(
            {containers: mockContainers},
            null,
            2,
        ),
        "docker/logs/flask-app.log": mockContainerLogs["flask-app"],
        "docker/logs/ros-motors.log": mockContainerLogs["ros-motors"],
        "bricklets/live-status.json": JSON.stringify(
            {tinkerforgeConnected: true, bricklets: []},
            null,
            2,
        ),
        "database/bricklets.json": JSON.stringify(mockData.bricklet, null, 2),
        "database/motors.json": JSON.stringify(
            mockData.motors.map((m) => ({
                name: m.name,
                turnedOn: m.turnedOn,
                velocity: m.velocity,
            })),
            null,
            2,
        ),
        "config/host-files-summary.json": JSON.stringify(
            {"config/os-release": "ok (mock)"},
            null,
            2,
        ),
        "commands/00_uname_-a.txt": "Linux pib-dev 6.6.0-raspi aarch64\n",
        "host-logs/setup-pib.log": "mock setup log\n",
    });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="pib-diagnostics-mock.zip"',
    );
    return res.status(200).send(zip);
});

server.use(router);

const port = 5000;
server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`);
});
