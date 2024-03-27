import {Block} from "blockly/core/block";

import {Order, pythonGenerator} from "blockly/python";

// Hinzufügen von verbotenen Wörtern, damit die Variablen im Pythoncode nicht überschrieben werden können
pythonGenerator.addReservedWords(
    "saved_motor_positions,all_motor_names,selected_motor,joint_trajectory_publisher,JointTrajectoryPublisher()",
);

export function textToSpeechGenerator(
    block: Block,
    generator: typeof pythonGenerator,
) {
    let code = "";

    // Auslesen der Block Inputs
    const voiceName = <string>block.getFieldValue("VOICENAME");
    const textInput = generator.valueToCode(block, "TEXT_INPUT", Order.ATOMIC);

    code = "";

    // Deklaration der ros2 JointTrajectory Publisher Klasse
    const moveMotorNode = generator.provideFunction_(
        "TextToSpeechClient",
        `
        class ${generator.FUNCTION_NAME_PLACEHOLDER_}(Node):

        def __init__(self):
    
            super().__init__('text_to_speech_client')
    
            # Client for sending requests to text-to-speech
            self.tts_push_client = self.create_client(TextToSpeechPush, 'tts_push')
            self.create_timer(0,self.push_text)
    
            
        def push_text(self) -> None:
            request: TextToSpeechPush.Request = TextToSpeechPush.Request()
            request.voice = ${voiceName}
            request.text = ${textInput}
            request.join = True
            self.tts_push_client.call(request)

`,
    );

    (generator as any).definitions_["import_rclpy"] = "import rclpy";
    (generator as any).definitions_["from_rclpy_node_import_Node"] =
        "from rclpy.node import Node";
    (generator as any).definitions_["import_time"] = "import time";
    (generator as any).definitions_[
        "from_datatypes_srv_import_TextToSpeechPush"
    ] = "from datatypes.srv import TextToSpeechPush";

    (generator as any).definitions_["rclpy_init"] = `rclpy.init()`;
    (generator as any).definitions_[
        "text_to_speech_client=TextToSpeechClient()"
    ] = `text_to_speech_client = TextToSpeechClient()`;

    code = `rclpy.spin_once(text_to_speech_client)`;

    return code;
}

export {pythonGenerator};
