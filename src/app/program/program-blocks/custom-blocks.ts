import * as Blockly from "blockly";

import {time_blocks} from "./time-blocks";
import {face_detector_blocks} from "./detectors-blocks";
import {motor_blocks} from "./motor-blocks";
import {playAudioFromSpeech} from "./play-audio-from-speech-block";

export function customBlockDefinition() {
    Blockly.common.defineBlocks(time_blocks);
    Blockly.common.defineBlocks(face_detector_blocks);
    Blockly.common.defineBlocks(motor_blocks);
    Blockly.common.defineBlocks(playAudioFromSpeech);

    face_detector_blocks["face_detector_running"].editable_ = false;
}
