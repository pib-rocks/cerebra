export interface Message {
    motor: string;
    value?: string;
    turnedOn?: boolean;
    pule_widths_min?: string;
    pule_widths_max?: string;
    rotation_range_min?: string;
    rotation_range_max?: string;
    velocity?: string;
    acceleration?: string;
    deceleration?: string;
    period?: string;
}
