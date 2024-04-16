export enum rosDataTypes {
    // std msgs
    int32 = "std_msgs/Int32",
    int32MultiArray = "std_msgs/Int32MultiArray",
    float64 = "std_msgs/Float64",
    string = "std_msgs/String",
    // msg
    motorSettings = "datatypes/msg/MotorSettings",
    chatMessage = "datatypes/msg/ChatMessage",
    voiceAssistantState = "datatypes/msg/VoiceAssistantState",
    voiceAssistantChatIsListening = "datatypes/msg/VoiceAssistantChatIsListening",
    jointTrajectory = "trajectory_msgs/msg/JointTrajectory",
    diagnosticStatus = "diagnostic_msgs/msg/DiagnosticStatus",
    // srv
    motorSettingsSrv = "datatypes/srv/MotorSettingsSrv",
    proxyRunProgramStart = "datatypes/srv/ProxyStartProgram",
    proxyRunProgramStop = "datatypes/srv/ProxyStopProgram",
    proxyRunProgramFeedback = "datatypes/msg/ProxyRunProgramFeedback",
    proxyRunProgramResult = "datatypes/msg/ProxyRunProgramResult",
    proxyRunProgramStatus = "datatypes/msg/ProxyRunProgramStatus",
    setVoiceAssistantState = "datatypes/srv/SetVoiceAssistantState",
    sendChatMessage = "datatypes/srv/SendChatMessage",
    getVoiceAssistantState = "datatypes/srv/GetVoiceAssistantState",
    getVoiceAssistantChatIsListening = "datatypes/srv/GetVoiceAssistantChatIsListening",
    // action
    runProgram = "datatypes/action/RunProgram",
}
