export interface MotorSettingsMessage {
    motor_name: string;
    turned_on: boolean;
    pulse_width_min: number;
    pulse_width_max: number;
    rotation_range_min: number;
    rotation_range_max: number;
    velocity: number;
    acceleration: number;
    deceleration: number;
    period: number;
    active: boolean;
    effort?: number;
    invert: boolean;
}
