import jsonServer from "json-server";
import mockData from "./json-server-database.json" assert {type: "json"};
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

const server = jsonServer.create();
const router = jsonServer.router(mockData);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

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

server.use(router);

const port = 5000;
server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`);
});
