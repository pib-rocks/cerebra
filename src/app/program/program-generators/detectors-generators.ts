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
        self.NN_OMZ_NAME = "face-detection-retail-0004"
        self.labelMap = ["background", "face"]        
        self.NN_WIDTH = 300
        self.NN_HEIGHT = 300

        self.VIDEO_WIDTH = 1080                 
        self.VIDEO_HEIGHT = 720                 

        self.frame = None
        self.detections = []
        self.startTime = time.monotonic()
        self.counter = 0
        self.color1 = (255, 0, 0)
        self.color2 = (255, 255, 255)
        self.fps = 0

        self.xmin_big = 0
        self.ymin_big = 0
        self.xmax_big = 0
        self.ymax_big = 0
        self.x_center = 0
        self.y_center = 0

        self.init_pipeline()


    def init_pipeline(self):
        self.pipeline = dai.Pipeline()

        self.detection_nn = self.pipeline.create(dai.node.MobileNetDetectionNetwork)
        self.detection_nn.setBlobPath(blobconverter.from_zoo(name = self.NN_OMZ_NAME, shaves=6))
        self.detection_nn.setConfidenceThreshold(0.5)
        self.detection_nn.setNumInferenceThreads(2)
        self.detection_nn.setNumNCEPerInferenceThread(1)
        self.detection_nn.input.setBlocking(False)

        self.cam = self.pipeline.create(dai.node.ColorCamera)
        self.cam.setPreviewSize(self.NN_WIDTH, self.NN_HEIGHT)
        self.cam.setVideoSize(self.VIDEO_WIDTH, self.VIDEO_HEIGHT)
        self.cam.setPreviewKeepAspectRatio(False)
        self.cam.setInterleaved(False)						
        self.cam.setFps(120)						
        self.cam.setBoardSocket(dai.CameraBoardSocket.CAM_A)
        self.cam.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
        self.cam.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)      
        self.cam.setIspScale(1, 1)
        self.cam.setVideoSize(self.VIDEO_WIDTH, self.VIDEO_HEIGHT)

        self.xout_cam = self.pipeline.create(dai.node.XLinkOut)
        self.xout_cam.setStreamName("cam")
        self.xout_nn = self.pipeline.create(dai.node.XLinkOut)
        self.xout_nn.setStreamName("nn")

        self.cam.video.link(self.xout_cam.input)
        self.cam.preview.link(self.detection_nn.input)
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
        self.xmin_big = 0
        self.ymin_big = 0
        self.xmax_big = 0
        self.ymax_big = 0

        for detection in self.detections:
            bbox = self.frameNorm((detection.xmin, detection.ymin, detection.xmax, detection.ymax))
            cv2.putText(self.frame, self.labelMap[detection.label], (bbox[0] +10, bbox[1] +20), cv2.FONT_HERSHEY_TRIPLEX, 0.5, self.color1)
            cv2.putText(self.frame, f"{int(detection.confidence * 100)}%", (bbox[0] +10, bbox[1] +40), cv2.FONT_HERSHEY_TRIPLEX, 0.5, self.color1)
            cv2.rectangle(self.frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), self.color1, 2)
            
            if ((detection.xmax - detection.xmin) * (detection.ymax - detection.ymin)) > ((self.xmax_big - self.xmin_big) * (self.ymax_big - self.ymin_big)):
                self.xmin_big = detection.xmin
                self.ymin_big = detection.ymin
                self.xmax_big = detection.xmax
                self.ymax_big = detection.ymax   

        cv2.imshow(name, self.frame)
        self.calculateMidpoint()

    def calculateMidpoint(self):
        if (self.xmin_big != 0 and self.ymin_big != 0 and self.xmax_big != 0 and self.ymax_big != 0):
            bbox = self.frameNorm((self.xmin_big, self.ymin_big, self.xmax_big, self.ymax_big))
            self.x_center = (bbox[0] + bbox[2])/2 - self.VIDEO_WIDTH/2
            self.y_center = (self.VIDEO_HEIGHT/2) - (bbox[1] + bbox[3])/2

    def updateDetector(self):
        self.in_frame = self.q_cam.tryGet()
        self.in_nn = self.q_nn.tryGet()

        if self.in_nn is not None:
            self.detections = self.in_nn.detections
            self.counter += 1

        if (time.monotonic() - self.startTime) > 1:
            self.fps = self.counter / (time.monotonic() - self.startTime)
            self.counter = 0
            self.startTime = time.monotonic()
            
        if self.in_frame is not None:
            self.frame = self.in_frame.getCvFrame()
            cv2.putText(self.frame, "NN FPS: {:.2f},".format(self.fps),
                (2, self.frame.shape[0] - 4), cv2.FONT_HERSHEY_TRIPLEX, 0.4, self.color2)  

        if self.frame is not None:
            self.displayFrame("Face Detector")
            
        return(self.x_center, self.y_center)

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
    const var_x_center = generator.getVariableName(
        block.getFieldValue("HORIZ_CENTER"),
    );
    const var_y_center = generator.getVariableName(
        block.getFieldValue("VERT_CENTER"),
    );

    code +=
        var_x_center +
        ", " +
        var_y_center +
        " = fd.updateDetector()\n" +
        "if cv2.waitKey(1) == ord('q'):\n" +
        generator.INDENT +
        "break\n";

    return code;
}
export {pythonGenerator};
