import jsonServer from "json-server";
import mockData from "./json-server-database.json" assert {type: 'json'};
import personalityDto from "./dto/personality.mjs";
import cameraSettingsDto from "./dto/camera-settings.mjs";
import chatDto from "./dto/chat.mjs";
import messageDto from "./dto/message.mjs";
import brickletDto from "./dto/bricklet.mjs"
import motorDto from "./dto/motor.mjs";
import motorsettings from "./dto/motorsettings.mjs"
import programDto from "./dto/program.mjs"
const server = jsonServer.create();
const router = jsonServer.router(mockData);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser)

//getAllPersonalities
server.get("/voice-assistant/personality", (req, res, next) =>{
  let response = [];
    mockData.personality.forEach((personality) =>{
      response.push(personalityDto.getPersonalityDTO(personality));
    });
    return res.status(200).send(response);
});

//getPersonalityByPersonalityId
server.get("/voice-assistant/personality/:personalityId", (req, res, next) =>{
  const response = mockData.personality.filter(perso => perso.personalityId == req.params.personalityId);
  if(response[0] == undefined){
    return res.status(404).send();
  }
  return res.status(200).send(response[0]);
});

//postPersonality
server.post("/voice-assistant/personality", (req, res, next) =>{
  const newPersonality = personalityDto.postPersonalityDTO(req.body.name, req.body.gender, req.body.pauseThreshold)
  mockData.personality.push(newPersonality);
  return res.status(201).send(newPersonality);
});

//updatePersonalityByPersonalityId
server.put("/voice-assistant/personality/:personalityId", (req, res, next) =>{
  mockData.personality.forEach((personality) => {
    if(personality.personalityId == req.params.personalityId){
      personality.name = req.body.name;
      personality.gender = req.body.gender;
      personality.pauseThreshold = req.body.pauseThreshold;
      return res.status(200).send(personality);
    }
  });
  return res.status(404).send();
});

//deletePersonalityByPersonalityId
server.delete("/voice-assistant/personality/:personalityId", (req, res, next) =>{
  const lengPersonality = mockData.personality.length;
  mockData.personality = mockData.personality.filter(perso => perso.personalityId != req.params.personalityId);
  if(lengPersonality == mockData.personality.length){
    return res.status(404).json();
  }
  return res.status(204).json();
});

//getChats
server.get("/voice-assistant/chat", (req, res, next) =>{
  let response = [];
    mockData.chats.forEach((chat) =>{
      response.push(chatDto.getChat(chat));
    });
    return res.status(200).send(response);
});

//postChat
server.post("/voice-assistant/chat", (req, res, next) =>{
  const newPersonality = chatDto.newChat(req.body.topic, req.body.personalityId)
  mockData.chats.push(newPersonality);
  return res.status(200).send(newPersonality);
});

//getChatById
server.get("/voice-assistant/chat/:chatId", (req, res, next) =>{
  const response = mockData.chats.filter(chat => chat.chatId == req.params.chatId);
  if(response[0] == undefined){
    return res.status(404).send();
  }
  return res.status(200).send(response[0]);
});

//updateChat
server.put("/voice-assistant/chat/:chatId", (req, res, next) =>{
  mockData.chats.forEach((chat) => {
    if(chat.chatId == req.params.chatId){
      chat.topic = req.body.topic;
      chat.personalityId = req.body.personalityId;
      return res.status(200).send(chatDto.getChat(chat));
    }
  });
  return res.status(404).send();
});

//deleteChat
server.delete("/voice-assistant/chat/:chatId", (req, res, next) =>{
  const lengChats = mockData.chats.length;
  mockData.chats = mockData.chats.filter(chat => chat.chatId != req.params.chatId);
  if(lengChats == mockData.chats.length){
    return res.status(404).json();
  }
  return res.status(204).json();
});

//getMessages
server.get("/voice-assistant/chat/:chatId/messages", (req, res, next) =>{
  let response = [];
    mockData.chatMessage.forEach((message) =>{
      if(message.chatId == req.params.chatId){
        response.push(messageDto.getMessage(message));
      }
    });
    if(response[0] == undefined){
      return res.status(404).send();  
    }
    return res.status(200).send(response);
});

//postMessage
server.post("/voice-assistant/chat/:chatId/messages", (req, res, next) =>{
  let response;
  mockData.chats.forEach((chat) =>{
    if(chat.chatId == req.params.chatId){
      response = messageDto.newMessage(req.body.timestamp, req.body.isUser, req.body.content, req.params.chatId);
      mockData.chatMessage.push(response);
      return res.status(200).send(response);
    }
  });
  if(response == undefined){
    return res.status(404).send("No chat with the given id was found.");
  }
});

//deleteMessage
server.delete("/voice-assistant/chat/:chatId/messages/:messageId", (req, res, next) =>{
  let remoed = false
  mockData.chats.forEach((chat) =>{
    if(chat.chatId == req.params.chatId){
      mockData.chatMessage.forEach((message) => {
        if(message.messageId == req.params.messageId){
          mockData.chatMessage = mockData.chatMessage.filter((message) => message.messageId != req.params.messageId);
          remoed = true
          return res.status(204).send();
        }
      });
    }
  });
  if(remoed == false){
    return res.status(404).send("No content with the given ids found");
  }
});

//getCameraSettings
server.get("/camera-settings", (req, res, next) =>{
  const cameraSettings = mockData.cameraSettings.filter(cam => cam.id == 1);
  const response = cameraSettingsDto.getCameraSettings(cameraSettings[0]);
  return res.status(200).send(response);
});

//updateCameraSettings
server.put("/camera-settings", (req, res, next) =>{
  mockData.cameraSettings.forEach((cam) => {
    if(cam.id == 1){
      cam.resolution = req.body.resolution;
      cam.refeshRate = req.body.refeshRate;
      cam.qualityFactor = req.body.qualityFactor;
      cam.resX = req.body.resX;
      cam.resY = req.body.resY;
      const response = cameraSettingsDto.getCameraSettings(cam.resolution, cam.refeshRate, cam.qualityFactor, cam.resX, cam.resY);
      return res.status(200).send(response);
    }
    else{
      return res.status(404).send();
    }
  });
});

//getAllBricklets
server.get("/bricklet", (req, res, next) =>{
  let response = [];
  mockData.bricklet.forEach((bricklet) =>{
    response.push(brickletDto.getBricklet(bricklet));
  });
  return res.status(200).send(response);
});

//getBrickletById
server.get("/bricklet/:brickletNumber", (req, res, next) =>{
  const bricklet = mockData.bricklet.filter((bricklet) => bricklet.brickletNumber == req.params.brickletNumber)[0];
  if(bricklet == undefined){
    return res.status(404).send();  
  }
  return res.status(200).send({"uid" : bricklet.uid});
});

//updateBrickletById
server.put("/bricklet/:brickletNumber", (req, res, next) =>{
  let response;
  mockData.bricklet.forEach((brick) =>{
    if(brick.brickletNumber == req.params.brickletNumber){
      console.log(brick.uid);
      console.log(req.body.uid);
      brick.uid = req.body.uid;
      response = brickletDto.getBricklet(brick)
    }
  })
  return res.status(200).send(response);
});

//getAllMotrs
server.get("/motor", (req, res, next) =>{
  let response = [];
  mockData.motors.forEach((motor) =>{
    let motorBrickletPin = [];
    mockData.brickletPin.forEach((brickeltPin) =>{
      if(brickeltPin.motorId == motor.id){
        motorBrickletPin.push(brickeltPin);
      }
    });
    let bricklets = [];
    mockData.bricklet.forEach((bricklet) =>{
      motorBrickletPin.forEach((motorBrickletPin) =>{
        if(motorBrickletPin.brickletId == bricklet.id){
          bricklets.push(bricklet);
        }
      });
      }
    );
    response.push(motorDto.getMotor(motor, bricklets));
  });
  return res.status(200).send(response);
});


//getMotorByName
server.get("/motor/:motorName", (req, res, next) =>{
  let response;
  const motor = mockData.motors.find((motor) => motor.name == req.params.motorName);
  if(motor == undefined){
    return res.status(404).send();
  }
  let motorBrickletPin = [];
    mockData.brickletPin.forEach((brickeltPin) =>{
      if(brickeltPin.motorId == motor.id){
        motorBrickletPin.push(brickeltPin);
      }
    });
    let bricklets = [];
    mockData.bricklet.forEach((bricklet) =>{
      motorBrickletPin.forEach((motorBrickletPin) =>{
        if(motorBrickletPin.brickletId == bricklet.id){
          bricklets.push(bricklet);
        }
      });
      }
    );
    response = motorDto.getMotor(motor, bricklets);
    return res.status(200).send(response);
});

//updateMotorByName
server.put("/motor/:motorName", (req, res, next) =>{
  let updated = false
  mockData.motors.forEach((motor) => {
    if(motor.name == req.params.motorName){
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
      mockData.brickletPin.forEach((brickeltPin) =>{
        if(brickeltPin.motorId == motor.id){
          motorBrickletPin.push(brickeltPin);
        }
      });
      let bricklets = [];
      mockData.bricklet.forEach((bricklet) =>{
        motorBrickletPin.forEach((motorBrickletPin) =>{
          if(motorBrickletPin.brickletId == bricklet.id){
            bricklets.push(bricklet);
          }
        });
        }
      );
      motor.bricklet = bricklets;
      return res.status(200).send(motor);
    }
  });
  if(updated == false){
    return res.status(404).send();
  }
});

//getMotorSettingsByName
server.get("/motor/:motorName/settings", (req, res, next) =>{
  let response;
  const motor = mockData.motors.find((motor) => motor.name == req.params.motorName);
  if(motor == undefined){
    return res.status(404).send();
  }
  response = motorsettings.getMotorSettings(motor);
  return res.status(200).send(response);
});

//putMotorSettingsByName
server.put("/motor/:motorName/settings", (req, res, next) =>{
  let updated = false;
  mockData.motors.forEach((motor) => {
    if(motor.name == req.params.motorName){
      updated = true
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
      return res.status(200).send(motor);
    }
  });
  if(updated == false){
    return res.status(404).send();
  }
});

//getAllPrograms
server.get("/program", (req, res, next) =>{
  let response = [];
  mockData.programs.forEach((program) =>{
    response.push(programDto.getProgram(program));
  });
  return res.status(200).send(response);
});

//postProgram
server.post("/program", (req, res, next) =>{
  const newProgram = programDto.postProgram(req.body.name, req.body.codeVisual);
  mockData.programs.push(newProgram);
  return res.status(200).send(newProgram);
});

//getProgramByProgramnumber
server.get("/program/:programNumber", (req, res, next) =>{
  let response = mockData.programs.find((program) => program.programNumber == req.params.programNumber);
  if(response == undefined){
    return res.status(404).send();
  }
  return res.status(200).send(response);
});

//deleteByProgramNumber
server.delete("/program/:programNumber", (req, res, next) =>{
  const lengPrograms = mockData.programs.length;
  mockData.programs = mockData.programs.filter(programs => programs.programNumber != req.params.programNumber);
  if (lengPrograms == mockData.programs.length){
    return res.status(404).send();
  }
  return res.status(204).send();
});

//getCodeByProgramnumber
server.get("/program/:programNumber/code", (req, res, next) =>{
  let response = mockData.programs.find((program) => program.programNumber == req.params.programNumber);
  if(response == undefined){
    return res.status(404).send();
  }
  response = programDto.returnCode(response);
  return res.status(200).send(response);
});

//putCodeByProgramnumber
server.put("/program/:programNumber/code", (req, res, next) =>{
  let updated = false;
  mockData.programs.forEach((program) => {
    if(program.programNumber == req.params.programNumber){
      program.codeVisual = req.body.codeVisual;
      updated = true;
      return res.status(200).send(programDto.getProgram(program));    
    }
  });
  if(updated == false){
    return res.status(404).send();
  }
});

server.use(router);

const port = 5000;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});