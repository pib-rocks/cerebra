import {MotorSettingsMessage} from "../msg/motor-settings-message";

export interface ApplyMotorSettingsRequest {
    motor_settings: MotorSettingsMessage;
}

export interface ApplyMotorSettingsResponse {
    settings_applied: boolean;
    settings_persisted: boolean;
}
