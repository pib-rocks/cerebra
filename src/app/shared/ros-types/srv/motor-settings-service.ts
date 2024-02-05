import {MotorSettingsMessage} from "../msg/motor-settings-message";

export interface MotorSettingsServiceRequest {
    motor_settings: MotorSettingsMessage;
}

export interface MotorSettingsServiceResponse {
    settings_applied: boolean;
    settings_persisted: boolean;
}
