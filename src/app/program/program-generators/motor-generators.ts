import {Block} from "blockly/core/block";

import {Order, pythonGenerator} from "blockly/python";

// Hinzufügen von verbotenen Wörtern, damit die Variablen im Pythoncode nicht überschrieben werden können
pythonGenerator.addReservedWords(
    "saved_motor_positions,all_motor_names,selected_motor,joint_trajectory_publisher,JointTrajectoryPublisher()",
);

export function move_motor(block: Block, generator: typeof pythonGenerator) {
    let code = "";
    (generator as any).definitions_["import_rclpy"] = "import rclpy";
    (generator as any).definitions_["from_rclpy_node_import_Node"] =
        "from rclpy.node import Node";
    (generator as any).definitions_["import_time"] = "import time";
    (generator as any).definitions_[
        "from_trajectory_msgs_msg_import_JointTrajectory_JointTrajectoryPoint"
    ] = "from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint";

    // Array mit allen Motor Namen. Reihenfolge muss mit motor_number in der Switch-Anweisung übereinstimmen
    (generator as any).definitions_["all_motor_names"] = `all_motor_names = [
        'thumb_left_opposition','thumb_left_stretch','index_left_stretch','middle_left_stretch','ring_left_stretch','pinky_left_stretch','all_fingers_left',
        'thumb_right_opposition','thumg_right_stretch','index_right_stretch','middle_right_stretch','ring_right_stretch','pinky_right_stretch','all_fingers_right',
        'upper_arm_left_rotation','elbow_left','lower_arm_left_rotation','wrist_left','shoulder_vertical_left','shoulder_horizontal_left',
        'upper_arm_right_rotation','elbow_right','lower_arm_right_rotation','wrist_right','shoulder_vertical_right','shoulder_horizontal_right',
        'tilt_forward_motor','tilt_sideways_motor','turn_head_motor'
]`;

    // Array zum Speichern der aktuellen Motor Positionen
    (generator as any).definitions_[
        "saved_motor_positions"
    ] = `saved_motor_positions = [0] * len(all_motor_names) `;

    const motor_name = block.getFieldValue("MOTORNAME");
    const mode_input = block.getFieldValue("MODE");
    const position_input = generator.valueToCode(
        block,
        "POSITION",
        Order.ATOMIC,
    );

    // Hier werden nur Dummy-Werte für Geschwindigkeit und Beschleunigung der Motoren gesetzt, da die Werte momentan von der Motor_control-Node nicht beachtet werden.
    //Es müssen allerdings Werte übergeben werden zur korrekten Funktion des JointTrajectoryPublishers
    const desired_velocity = 16000.0;
    const desired_acceleration = 10000.0;

    // zur Berechnung der gewünschten Position bzw. zum Selektieren des gewünschten Motors
    let position_string = "";
    let motor_number = 0;

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
        point.velocities = [float(${desired_velocity})]
        point.accelerations = [float(${desired_acceleration})]
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
    (generator as any).definitions_["selected_motor"] = `selected_motor = 0`;

    // Alle Motoren auf eine motor_number mappen
    // Ansprechen der Motoren und dem zugehörigen Positionswert über den Index "motor_number".
    // Index wird für die Listen "current_motor_positions" und "all_motor_names" verwendet
    switch (motor_name) {
        case "THUMB_LEFT_OPPOSITION": {
            motor_number = 0;
            break;
        }
        case "THUMB_LEFT_STRETCH": {
            motor_number = 1;
            break;
        }
        case "INDEX_LEFT_STRETCH": {
            motor_number = 2;
            break;
        }
        case "MIDDLE_LEFT_STRETCH": {
            motor_number = 3;
            break;
        }
        case "RING_LEFT_STRETCH": {
            motor_number = 4;
            break;
        }
        case "PINKY_LEFT_STRETCH": {
            motor_number = 5;
            break;
        }
        case "ALL_FINGERS_LEFT": {
            motor_number = 6;
            break;
        }
        case "THUMB_RIGHT_OPPOSITION": {
            motor_number = 7;
            break;
        }
        case "THUMB_RIGHT_STRETCH": {
            motor_number = 8;
            break;
        }
        case "INDEX_RIGHT_STRETCH": {
            motor_number = 9;
            break;
        }
        case "MIDDLE_RIGHT_STRETCH": {
            motor_number = 10;
            break;
        }
        case "RING_RIGHT_STRETCH": {
            motor_number = 11;
            break;
        }
        case "PINKY_RIGHT_STRETCH": {
            motor_number = 12;
            break;
        }
        case "ALL_FINGERS_RIGHT": {
            motor_number = 13;
            break;
        }
        case "UPPER_ARM_LEFT_ROTATION": {
            motor_number = 14;
            break;
        }
        case "ELBOW_LEFT": {
            motor_number = 15;
            break;
        }
        case "LOWER_ARM_LEFT_ROTATION": {
            motor_number = 16;
            break;
        }
        case "WRIST_LEFT": {
            motor_number = 17;
            break;
        }
        case "SHOULDER_VERTICAL_LEFT": {
            motor_number = 18;
            break;
        }
        case "SHOULDER_HORIZONTAL_LEFT": {
            motor_number = 19;
            break;
        }
        case "UPPER_ARM_RIGHT_ROTATION": {
            motor_number = 20;
            break;
        }
        case "ELBOW_RIGHT": {
            motor_number = 21;
            break;
        }
        case "LOWER_ARM_RIGHT_ROTATION": {
            motor_number = 22;
            break;
        }
        case "WRIST_RIGHT": {
            motor_number = 23;
            break;
        }
        case "SHOULDER_VERTICAL_RIGHT": {
            motor_number = 24;
            break;
        }
        case "SHOULDER_HORIZONTAL_RIGHT": {
            motor_number = 25;
            break;
        }
        case "TILT_FORWARD_MOTOR": {
            motor_number = 26;
            break;
        }
        case "TILT_SIDEWAYS_MOTOR": {
            motor_number = 27;
            break;
        }
        case "TURN_HEAD_MOTOR": {
            motor_number = 28;
            break;
        }
    }

    // generiert Pythoncode für relative oder absolute Positionsvorgabe.
    // Aktuelle Position zur Berechnung für die relative Positionsvorgabe wird in generierter Pythonliste "saved_motor_positions" gespeichert

    if (mode_input == "ABSOLUTE") {
        position_string = position_input;
    } else if (mode_input == "RELATIVE") {
        position_string =
            "saved_motor_positions[" + motor_number + "] + " + position_input;
    }

    // JointTrajectoryPublisher erstellen bzw. einmalig publishen der Position

    code =
        "selected_motor = " +
        motor_number +
        "\n" +
        "saved_motor_positions[selected_motor] = float(" +
        position_string +
        ")\n" +
        "rclpy.spin_once(joint_trajectory_publisher)\n";

    return code;
}

export {pythonGenerator};
