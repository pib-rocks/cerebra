import {MotorSettingsMessage} from "../ros-message-types/motorSettingsMessage";

export interface MotorSettings {
    velocity: number;
    acceleration: number;
    deceleration: number;
    period: number;
    pulseWidthMin: number;
    pulseWidthMax: number;
    rotationRangeMin: number;
    rotationRangeMax: number;
    turnedOn: boolean;
    visible: boolean;
}
