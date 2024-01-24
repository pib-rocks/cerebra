import {Block} from "blockly/core/block";
import {pythonGenerator} from "blockly/python";

pythonGenerator.addReservedWords("fd");

export function face_detector_start_stop(
    block: Block,
    generator: typeof pythonGenerator,
) {
    let code = "";

    const dropDownSetting = block.getFieldValue("SETTING");
    if (dropDownSetting == "START") {
        (generator as any).definitions_["import_numpy_as_np"] =
            "import numpy as np";
        (generator as any).definitions_["import_cv2"] = "import cv2";
        (generator as any).definitions_["import_depthai_as_dai"] =
            "import depthai as dai";
        (generator as any).definitions_["import_blobconverter"] =
            "import blobconverter";
        (generator as any).definitions_["import_time"] = "import time";

        const className = generator.provideFunction_(
            "FaceDetector",
            `
class ${generator.FUNCTION_NAME_PLACEHOLDER_}():
  def __init__(self):
    self.NN_OMZ_NAME = "face-detection-adas-0001"
    self.NN_WIDTH = 672
    self.NN_HEIGHT = 384
    self.labelMap = ["background", "face"]

    self.frame = None
    self.detections = []
    self.startTime = time.monotonic()
    self.counter = 0
    
    self.color1 = (255, 0, 0)
    self.color2 = (255, 255, 255)

    self.xmin = 0
    self.ymin = 0
    self.xmax = 0
    self.ymax = 0
    self.init_pipeline()
    self.start_pipeline()

  def init_pipeline(self):
    self.pipeline = dai.Pipeline()
    self.cam_rgb = self.pipeline.create(dai.node.ColorCamera)
    self.detection_nn = self.pipeline.create(dai.node.MobileNetDetectionNetwork)
    self.xout_rgb = self.pipeline.create(dai.node.XLinkOut)
    self.nn_out = self.pipeline.create(dai.node.XLinkOut)

    self.xout_rgb.setStreamName("rgb")
    self.nn_out.setStreamName("nn")

    self.cam_rgb.setPreviewSize(self.NN_WIDTH, self.NN_HEIGHT)
    self.cam_rgb.setInterleaved(False)
    self.cam_rgb.setFps(30)

    self.cam_rgb.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)
    self.cam_rgb.setBoardSocket(dai.CameraBoardSocket.RGB)
    self.cam_rgb.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)

    self.detection_nn.setConfidenceThreshold(0.5)
    self.detection_nn.setBlobPath(blobconverter.from_zoo(name = self.NN_OMZ_NAME, shaves = 6))
    self.detection_nn.setNumInferenceThreads(2)
    self.detection_nn.input.setBlocking(False)

    self.detection_nn.passthrough.link(self.xout_rgb.input)
    self.cam_rgb.preview.link(self.detection_nn.input)
    self.detection_nn.out.link(self.nn_out.input)

  def start_pipeline(self):
    self.device = dai.Device(self.pipeline)

    try:
      self.q_rgb = self.device.getOutputQueue("rgb", maxSize=4, blocking = False)
    except dai.XLinkError as exc:
      print(exc)
      fd.device.close()

    try:
      self.q_det = self.device.getOutputQueue("nn", maxSize=4, blocking = False)
    except dai.XLinkError as exc:
      print(exc)
      fd.device.close()

  def frameNorm(self, bbox):
    normVals = np.full(len(bbox), self.frame.shape[0])
    normVals[::2] = self.frame.shape[1]
    return (np.clip(np.array(bbox), 0, 1) * normVals).astype(int)
    
  def displayFrame(self, name):
    for detection in self.detections:
      bbox = self.frameNorm((detection.xmin, detection.ymin, detection.xmax, detection.ymax))
      cv2.putText(self.frame, self.labelMap[detection.label], (bbox[0] +10, bbox[1] +20), cv2.FONT_HERSHEY_TRIPLEX, 0.5, self.color1)
      cv2.putText(self.frame, f"{int(detection.confidence * 100)}%", (bbox[0] +10, bbox[1] +40), cv2.FONT_HERSHEY_TRIPLEX, 0.5, self.color1)
      cv2.rectangle(self.frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), self.color1, 2)
    
      self.xmin = detection.xmin
      self.ymin = detection.ymin
      self.xmax = detection.xmax
      self.ymax = detection.ymax
    cv2.imshow(name, self.frame)
    
  def updateDetector(self):
    self.in_rgb = self.q_rgb.tryGet()
    self.in_det = self.q_det.tryGet()

    if self.in_rgb is not None:
      self.frame = self.in_rgb.getCvFrame()
      cv2.putText(self.frame, "NN FPS: {:.2f}".format(self.counter / (time.monotonic() - self.startTime)),
      (2, self.frame.shape[0] - 4), cv2.FONT_HERSHEY_TRIPLEX, 0.4, self.color2)

    if self.in_det is not None:
      self.detections = self.in_det.detections
      self.counter += 1
    else:
      self.xmin = 0
      self.ymin = 0
      self.xmax = 0
      self.ymax = 0
    
    if self.frame is not None:
      self.displayFrame("rgb")
      
    return self.xmin, self.ymin, self.xmax, self.ymax
`,
        );
        code +=
            "fd = " + className + "()\n" + 'print("Starting face detector")\n';
    } else {
        code += "fd.device.close()" + "\n" + 'print("Closing face detector")\n';
    }
    return code;
}

export function face_detector_running(block: Block, generator: any) {
    let code = "";
    const var_xmin = generator.getVariableName(block.getFieldValue("XMIN"));
    const var_ymin = generator.getVariableName(block.getFieldValue("YMIN"));
    const var_xmax = generator.getVariableName(block.getFieldValue("XMAX"));
    const var_ymax = generator.getVariableName(block.getFieldValue("YMAX"));

    code +=
        var_xmin +
        ", " +
        var_ymin +
        ", " +
        var_xmax +
        ", " +
        var_ymax +
        " = fd.updateDetector()\n\n";

    return code;
}
export {pythonGenerator};
