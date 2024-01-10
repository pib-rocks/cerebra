import * as Blockly from "blockly";

import {face_detector_blocks} from "./detectors-blocks";

export function customBlockDefinition() {
    Blockly.common.defineBlocks(face_detector_blocks);
}
