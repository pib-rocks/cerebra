export interface MotorSettingsMessage {
    motorName: string;
    turnedOn?: boolean;
    pulse_widths_min?: string;
    pulse_widths_max?: string;
    rotation_range_min?: string;
    rotation_range_max?: string;
    velocity?: string;
    acceleration?: string;
    deceleration?: string;
    period?: string;
}
