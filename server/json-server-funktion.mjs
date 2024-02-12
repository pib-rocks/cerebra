import jsonServer from "json-server";
import mockData from "./json-server-database.json" assert {type: 'json'};
import personalityDto from "./dto/personality.mjs";
import cameraSettingsDto from "./dto/camera-settings.mjs";
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
  return res.status(200).send(response);
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

//getCameraSettings
server.get("/camera-settings", (req, res, next) =>{
  const cameraSettings = mockData.cameraSettings.filter(cam => cam.id == 1);
  const response = new cameraSettingsDto(cameraSettings[0].resolution, cameraSettings[0].refeshRate, cameraSettings[0].qualityFactor, cameraSettings[0].resX, cameraSettings[0].resY);
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
      const response = new cameraSettingsDto(cam.resolution, cam.refeshRate, cam.qualityFactor, cam.resX, cam.resY);
      return res.status(200).send(response);
    }
    else{
      return res.status(404).send();
    }
  });
});


server.use(router);

const port = 5000;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});

// auslagern
// "/voice-assistant/chat/:id/messsages/:id" : "/chats/$1?chatMessage.id=2&_embed=chatMessage" // filter für child implementieren
// "/motor" : "/motors" // ebenfalls die pins sowie bricklet UID zurückgeben
// "/motor/:motorName" : "/motors?name=$1" // ebenfalls die pins sowie bricklet UID zurückgeben
// "/motor/:motorName/bricklet-pins" : "/motors?name=$1" // nur namen un dbricklet pin sowie bricklet uid returnen
// "/program" : "/program", // ohne code
// "/program/:programm-number" : "/program/$1", // ohne code
