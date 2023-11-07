export interface MotorSettingsMessage {
    name: string;
    turnedOn: boolean;
    pulseWidthMin: number;
    pulseWidthMax: number;
    rotationRangeMin: number;
    rotationRangeMax: number;
    velocity: number;
    acceleration: number;
    deceleration: number;
    period: number;
    effort?: number;
}
