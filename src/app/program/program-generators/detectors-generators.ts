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
        self.VIDEO_WIDTH = 1024
        self.VIDEO_HEIGHT = 720
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
        self.x_middle = 0
        self.y_middle = 0
        self.fps = 0

        self.init_pipeline()

    def init_pipeline(self):
        self.pipeline = dai.Pipeline()
        
        self.detection_nn = self.pipeline.create(dai.node.MobileNetDetectionNetwork)
        self.detection_nn.setConfidenceThreshold(0.5)
        self.detection_nn.setBlobPath(blobconverter.from_zoo(name = self.NN_OMZ_NAME, shaves = 6))
        self.detection_nn.setNumInferenceThreads(2)
        self.detection_nn.setNumNCEPerInferenceThread(1)
        self.detection_nn.input.setBlocking(False)

        self.cam = self.pipeline.create(dai.node.ColorCamera)
        self.cam.setPreviewSize(self.VIDEO_WIDTH, self.VIDEO_HEIGHT)
        self.cam.setInterleaved(False)						
        self.cam.setFps(120)						
        self.cam.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)
        self.cam.setBoardSocket(dai.CameraBoardSocket.RGB)
        self.cam.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)

        self.manip = self.pipeline.create(dai.node.ImageManip)
        self.manip.initialConfig.setResize(self.NN_WIDTH, self.NN_HEIGHT)
        self.manip.initialConfig.setFrameType(dai.RawImgFrame.Type.BGR888p)
        self.manip.inputConfig.setWaitForMessage(False)
        
        self.xout_cam = self.pipeline.create(dai.node.XLinkOut)
        self.xout_nn = self.pipeline.create(dai.node.XLinkOut)
        self.xout_cam.setStreamName("cam")
        self.xout_nn.setStreamName("nn")

        self.cam.preview.link(self.manip.inputImage)
        self.cam.preview.link(self.xout_cam.input)
        self.manip.out.link(self.detection_nn.input)
        self.detection_nn.out.link(self.xout_nn.input)

        self.device = dai.Device(self.pipeline)

        try:
            self.q_cam = self.device.getOutputQueue("cam", maxSize=1, blocking = False)
        except dai.XLinkError as exc:
            print(exc)

        try:
            self.q_nn = self.device.getOutputQueue("nn", maxSize=1, blocking = False)
        except dai.XLinkError as exc:
            print(exc)

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

            self.xmin = bbox[0]
            self.ymin = bbox[1]
            self.xmax = bbox[2]
            self.ymax = bbox[3]
            
            self.x_middle = (self.xmin + self.xmax)/2 - self.VIDEO_WIDTH/2
            self.y_middle = (self.VIDEO_HEIGHT/2) - (self.ymin + self.ymax)/2
            
        cv2.imshow(name, self.frame)

    def updateDetector(self):
        self.in_frame = self.q_cam.tryGet()
        self.in_nn = self.q_nn.tryGet()

        if self.in_frame is not None:
            self.frame = self.in_frame.getCvFrame()
            self.latency = (dai.Clock.now() - self.in_frame.getTimestamp()).total_seconds() *1000
            cv2.putText(self.frame, "NN FPS: {:.2f},   Latency: {:.2f} ms".format(self.fps, self.latency),
            (2, self.frame.shape[0] - 4), cv2.FONT_HERSHEY_TRIPLEX, 0.4, self.color2)

        if self.in_nn is not None:
            self.detections = self.in_nn.detections
            self.counter += 1

            if (time.monotonic() - self.startTime) > 1:
                self.fps = self.counter / (time.monotonic() - self.startTime)
                self.counter = 0
                self.startTime = time.monotonic()
        else:
            self.xmin = 0
            self.ymin = 0
            self.xmax = 0
            self.ymax = 0
            self.x_middle = 0
            self.y_middle = 0

        if self.frame is not None:
            self.displayFrame("cam")

        return self.x_middle, self.y_middle
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
    const var_xmiddle = generator.getVariableName(
        block.getFieldValue("HORIZ_CENTER"),
    );
    const var_ymiddle = generator.getVariableName(
        block.getFieldValue("VERT_CENTER"),
    );

    code += var_xmiddle + ", " + var_ymiddle + " = fd.updateDetector()\n\n";

    return code;
}
export {pythonGenerator};
