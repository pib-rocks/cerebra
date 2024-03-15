import {Block} from "blockly/core/block";

import {Order, pythonGenerator} from "blockly/python";

// Hinzufügen von verbotenen Wörtern, damit die Variablen im Pythoncode nicht überschrieben werden können
pythonGenerator.addReservedWords(
    "saved_motor_positions,all_motor_names,selected_motor,joint_trajectory_publisher,JointTrajectoryPublisher()",
);

export function move_motor(block: Block, generator: typeof pythonGenerator) {
    let code = "";

    // Auslesen der Block Inputs
    const motorName = <string>block.getFieldValue("MOTORNAME");
    const modeInput = block.getFieldValue("MODE");
    const positionInput = generator.valueToCode(
        block,
        "POSITION",
        Order.ATOMIC,
    );

    // Alle verfügbaren Motoren
    const motors = {
        THUMB_LEFT_OPPOSITION: 0,
        THUMB_LEFT_STRETCH: 1,
        INDEX_LEFT_STRETCH: 2,
        MIDDLE_LEFT_STRETCH: 3,
        RING_LEFT_STRETCH: 4,
        PINKY_LEFT_STRETCH: 5,
        ALL_FINGERS_LEFT: 6,
        THUMB_RIGHT_OPPOSITION: 7,
        THUMB_RIGHT_STRETCH: 8,
        INDEX_RIGHT_STRETCH: 9,
        MIDDLE_RIGHT_STRETCH: 10,
        RING_RIGHT_STRETCH: 11,
        PINKY_RIGHT_STRETCH: 12,
        motorNumber: 13,
        UPPER_ARM_LEFT_ROTATION: 14,
        ELBOW_LEFT: 15,
        LOWER_ARM_LEFT_ROTATION: 16,
        WRIST_LEFT: 17,
        SHOULDER_VERTICAL_LEFT: 18,
        SHOULDER_HORIZONTAL_LEFT: 19,
        UPPER_ARM_RIGHT_ROTATION: 20,
        ELBOW_RIGHT: 21,
        LOWER_ARM_RIGHT_ROTATION: 22,
        WRIST_RIGHT: 23,
        SHOULDER_VERTICAL_RIGHT: 24,
        SHOULDER_HORIZONTAL_RIGHT: 25,
        TILT_FORWARD_MOTOR: 26,
        TILT_SIDEWAYS_MOTOR: 27,
        TURN_HEAD_MOTOR: 28,
    };

    // motorName auf motorNumber mappen
    const getMotorNumber = (str: string) => {
        return motors[str as keyof typeof motors];
    };
    const motorNumber = getMotorNumber(motorName);

    (generator as any).definitions_["import_rclpy"] = "import rclpy";
    (generator as any).definitions_["from_rclpy_node_import_Node"] =
        "from rclpy.node import Node";
    (generator as any).definitions_["import_time"] = "import time";
    (generator as any).definitions_[
        "from_trajectory_msgs_msg_import_JointTrajectory_JointTrajectoryPoint"
    ] = "from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint";

    // Erstelle eine Pythonliste mit allen Motor Namen
    const Keys = Object.keys(motors);
    let strKeys = Keys.toString();
    strKeys = strKeys.toLowerCase().replaceAll(",", "', '");
    strKeys = "'" + strKeys + "'";

    (generator as any).definitions_["all_motor_names"] =
        "all_motor_names = [" + strKeys + "]";

    // Pythonliste zum Speichern der aktuellen Motor Positionen
    (generator as any).definitions_[
        "saved_motor_positions"
    ] = `saved_motor_positions = [0] * len(all_motor_names) `;

    // Hier werden nur Dummy-Werte für Geschwindigkeit und Beschleunigung der Motoren gesetzt, da die Werte momentan von der Motor_control-Node nicht beachtet werden.
    //Es müssen allerdings Werte übergeben werden zur korrekten Funktion des JointTrajectoryPublishers
    const desiredVelocity = 16000.0;
    const desiredAcceleration = 10000.0;

    // Deklaration der ros2 JointTrajectory Publisher Klasse
    const moveMotorNode = generator.provideFunction_(
        "JointTrajectoryPublisher",
        `
class ${generator.FUNCTION_NAME_PLACEHOLDER_}(Node):
    def __init__(self):                
        super().__init__('joint_trajectory_publisher')
        qos_policy = rclpy.qos.QoSProfile(reliability=rclpy.qos.ReliabilityPolicy.RELIABLE, history=rclpy.qos.HistoryPolicy.KEEP_LAST, durability=rclpy.qos.DurabilityPolicy.TRANSIENT_LOCAL, depth=1)
        self.publisher = self.create_publisher(JointTrajectory, '/joint_trajectory', qos_profile=qos_policy)
        timer_period = 0.1
        self.timer = self.create_timer(timer_period, self.timer_callback)

    def timer_callback(self):
        msg = JointTrajectory()
        msg.header.frame_id = 'default_frame'
        msg.header.stamp.sec = round(time.time())
        msg.joint_names = [all_motor_names[selected_motor]]
        point = JointTrajectoryPoint()
        point.positions = [saved_motor_positions[selected_motor]]
        point.velocities = [${desiredVelocity}.0]
        point.accelerations = [${desiredAcceleration}.0]
        point.time_from_start.sec = 0
        point.time_from_start.nanosec = 10000000
        msg.points.append(point)
        self.publisher.publish(msg)
        self.get_logger().info('Publishing: "%s"' % msg)

`,
    );

    // Einmaliges Starten von Ros2 und des JT-Publishers, wird nach der Klassendefinition als global definiert
    (generator as any).definitions_["rclpy_init"] = `rclpy.init()`;
    (generator as any).definitions_[
        "joint_trajectory_publisher_=_JointTrajectoryPublisher()"
    ] = `joint_trajectory_publisher = JointTrajectoryPublisher()`;
    (generator as any).definitions_["selected_motor"] = `selected_motor = None`;

    // generiert Pythoncode für relative oder absolute Positionsvorgabe.
    // Aktuelle Position zur Berechnung für die relative Positionsvorgabe wird in generierter Pythonliste "saved_motor_positions" gespeichert
    let positionString = "";

    if (modeInput == "ABSOLUTE") {
        positionString = positionInput;
    } else if (modeInput == "RELATIVE") {
        positionString =
            "saved_motor_positions[" + motorNumber + "] + " + positionInput;
    }

    // JointTrajectoryPublisher erstellen bzw. einmalig publishen der Position
    code =
        "selected_motor = " +
        motorNumber +
        "\n" +
        "saved_motor_positions[" +
        motorNumber +
        "] = float(" +
        positionString +
        ")\n" +
        "rclpy.spin_once(joint_trajectory_publisher)\n";

    return code;
}

export {pythonGenerator};
