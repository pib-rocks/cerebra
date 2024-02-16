export interface BrickletPinDTO {
    pin: number;
    bricklet: string;
}

export interface MotorSettingsDTO {
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
    visible: boolean;
    invert: boolean;
}

export interface MotorDTO extends MotorSettingsDTO {
    brickletPins: BrickletPinDTO[];
}
