export enum rosDataTypes {
    // std msgs
    int32 = "std_msgs/Int32",
    int32MultiArray = "std_msgs/Int32MultiArray",
    float64 = "std_msgs/Float64",
    string = "std_msgs/String",
    // msg
    motorSettings = "datatypes/msg/MotorSettings",
    jointTrajectory = "trajectory_msgs/msg/JointTrajectory",
    diagnosticStatus = "diagnostic_msgs/msg/DiagnosticStatus",
    // srv
    motorSettingsSrv = "datatypes/srv/MotorSettingsSrv",
    // action
    voiceAssitant = "datatypes/action/VoiceAssistant",
}
