import jsonServer from "json-server";
import mockData from "./json-server-database.json" assert {type: 'json'};
import personalityDto from "./dto/personality.mjs";
import cameraSettingsDto from "./dto/camera-settings.mjs";
import chatDto from "./dto/chat.mjs";
import messageDto from "./dto/message.mjs";
import brickletDto from "./dto/bricklet.mjs"
import motorDto from "./dto/motor.mjs";
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
  if(response == undefined){
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
  mockData.personality = mockData.personality.filter(perso => perso.personalityId != req.params.personalityId);
  return res.status(204).json();
});

//getChats
server.get("/voice-assistant/chat", (req, res, next) =>{
  let response = [];
    mockData.chats.forEach((chat) =>{
      response.push(chatDto.getChat(chat.chatId, chat.topic, chat.personalityId));
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
  if(response == undefined){
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
      return res.status(200).send(chatDto.getChat(chat.chatId, chat.topic, chat.personalityId));
    }
  });
  return res.status(404).send();
});

//deleteChat
server.delete("/voice-assistant/chat/:chatId", (req, res, next) =>{
  mockData.chats = mockData.chats.filter(chat => chat.chatId != req.params.chatId);
  return res.status(204).json();
});

//getMessages
server.get("/voice-assistant/chat/:chatId/messages", (req, res, next) =>{
  let response = [];
    mockData.chatMessage.forEach((message) =>{
      if(message.chatId == req.params.chatId){
        response.push(messageDto.getMessage(message.messageId, message.timestamp, message.isUser, message.content));
      }
    });
    return res.status(200).send(response);
});

//postMessage
server.post("/voice-assistant/chat/:chatId/messages", (req, res, next) =>{
  let response
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

//postDelete
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
  const response = cameraSettingsDto.getCameraSettings(cameraSettings[0].resolution, cameraSettings[0].refeshRate, cameraSettings[0].qualityFactor, cameraSettings[0].resX, cameraSettings[0].resY);
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
  const uid = mockData.bricklet.filter((bricklet) => bricklet.brickletNumber == req.params.brickletNumber)[0].uid;
  return res.status(200).send({uid});
});

//updateBrickletById
server.put("/bricklet/:brickletNumber", (req, res, next) =>{
  let response
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


server.use(router);

const port = 5000;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});