import {CodeGenerator} from "blockly";
import {Block} from "blockly/core/block";

import {Order, pythonGenerator} from "blockly/python";

pythonGenerator.addReservedWords(
    "play_audio_from_speech_client,PlayAudioFromSpeechClient()",
);

export function playAudioFromSpeechGenerator(
    block: Block,
    generator: CodeGenerator,
) {
    let code = "";

    // read input values of block
    const voiceName = <string>block.getFieldValue("VOICENAME");
    const textInput = generator.valueToCode(block, "TEXT_INPUT", Order.ATOMIC);

    // declare ros-node class
    generator.provideFunction_(
        "PlayAudioFromSpeechClient",
        `
        class ${generator.FUNCTION_NAME_PLACEHOLDER_}(Node):

        def __init__(self):
    
            super().__init__('play_audio_from_speech_client')
    
            self.client = self.create_client(PlayAudioFromSpeech, 'play_audio_from_speech')
            self.get_logger().info(f"waiting for 'play_audio_from_speech' service to become available...")
            self.client.wait_for_service()
            self.get_logger().info(f"service now available")
    
        def play_audio_from_speech(self, speech: str, voice: str) -> None:
    
            self.get_logger().info(f"received request to say '{speech}' as '{voice}'.")
    
            request = PlayAudioFromSpeech.Request()
            request.speech = speech
            request.join = True
    
            if voice == 'Hannah':
                request.gender = "Female"
                request.language = "German"
            elif voice == 'Daniel':
                request.gender = "Male"
                request.language = "German"
            elif voice == 'Emma':
                request.gender = "Female"
                request.language = "English"
            elif voice == 'Brian':
                request.gender = "Male"
                request.language = "English"
            else:
                self.get_logger().error(f"unrecognized voice: '{voice}', aborting...")
                return

            future = self.client.call_async(request)

            self.get_logger().info(f"now speaking...")
            rclpy.spin_until_future_complete(self, future)
            self.get_logger().info("finished speaking.")
`,
    );

    (generator as any).definitions_["import_rclpy"] = "import rclpy";
    (generator as any).definitions_["from_rclpy_node_import_Node"] =
        "from rclpy.node import Node";
    (generator as any).definitions_[
        "from_datatypes_srv_import_PlayAudioFromSpeech"
    ] = "from datatypes.srv import PlayAudioFromSpeech";
    (generator as any).definitions_["rclpy_init"] = `rclpy.init()`;
    (generator as any).definitions_[
        "play_audio_from_speech_client_PlayAudioFromSpeechClient"
    ] = `play_audio_from_speech_client = PlayAudioFromSpeechClient()`;

    code = `play_audio_from_speech_client.play_audio_from_speech(${textInput}, ${voiceName})\n`;

    return code;
}

export {pythonGenerator};
