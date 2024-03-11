import {pythonGenerator} from "blockly/python";

import * as face_detector_blocks from "./detectors-generators";
import * as time_blocks from "./time-generators";
import * as motor_blocks from "./motor-generators";

export * from "blockly/python";

const generators: typeof pythonGenerator.forBlock = {
    ...face_detector_blocks,
    ...time_blocks,
    ...motor_blocks,
};

for (const name in generators) {
    pythonGenerator.forBlock[name] = generators[name];
}
