export interface Message {
    motor: string;
    value?: string;
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
