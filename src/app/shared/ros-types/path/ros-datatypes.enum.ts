export enum rosDataTypes {
    // std msgs
    empty = "std_msgs/Empty",
    int32 = "std_msgs/Int32",
    int32MultiArray = "std_msgs/Int32MultiArray",
    float64 = "std_msgs/Float64",
    string = "std_msgs/String",
    // msg
    motorSettings = "datatypes/msg/MotorSettings",
    chatMessage = "datatypes/msg/ChatMessage",
    voiceAssistantState = "datatypes/msg/VoiceAssistantState",
    chatIsListening = "datatypes/msg/ChatIsListening",
    jointTrajectory = "trajectory_msgs/msg/JointTrajectory",
    diagnosticStatus = "diagnostic_msgs/msg/DiagnosticStatus",
    proxyRunProgramFeedback = "datatypes/msg/ProxyRunProgramFeedback",
    proxyRunProgramResult = "datatypes/msg/ProxyRunProgramResult",
    proxyRunProgramStatus = "datatypes/msg/ProxyRunProgramStatus",
    programInput = "datatypes/msg/ProgramInput",
    // srv
    applyMotorSettings = "datatypes/srv/ApplyMotorSettings",
    proxyRunProgramStart = "datatypes/srv/ProxyStartProgram",
    proxyRunProgramStop = "datatypes/srv/ProxyStopProgram",
    setVoiceAssistantState = "datatypes/srv/SetVoiceAssistantState",
    sendChatMessage = "datatypes/srv/SendChatMessage",
    getVoiceAssistantState = "datatypes/srv/GetVoiceAssistantState",
    getChatIsListening = "datatypes/srv/GetChatIsListening",
    applyJointTrajectory = "datatypes/srv/ApplyJointTrajectory",
    get_token_exists = "datatypes/srv/GetTokenExists",
    encryptToken = "datatypes/srv/EncryptToken",
    decryptToken = "datatypes/srv/DecryptToken",
    applyPose = "datatypes/srv/ApplyPose",
    // action
    runProgram = "datatypes/action/RunProgram",
}
