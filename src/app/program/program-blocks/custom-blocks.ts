import * as Blockly from "blockly";

import {time_blocks} from "./time-blocks";
import {face_detector_blocks} from "./detectors-blocks";

export function customBlockDefinition() {
    Blockly.common.defineBlocks(time_blocks);
    Blockly.common.defineBlocks(face_detector_blocks);

    face_detector_blocks["face_detector_running"].editable_ = false;
}
