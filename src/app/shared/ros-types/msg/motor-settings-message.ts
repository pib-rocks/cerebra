import {MotorSettings} from "../../types/motor-settings.class";

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
    visible: boolean;
    invert: boolean;
}

export function fromMotorSettings(
    motorname: string,
    motorSettings: MotorSettings,
): MotorSettingsMessage {
    return {
        motor_name: motorname,
        turned_on: motorSettings.turnedOn,
        pulse_width_min: motorSettings.pulseWidthMin,
        pulse_width_max: motorSettings.pulseWidthMax,
        rotation_range_min: motorSettings.rotationRangeMin,
        rotation_range_max: motorSettings.rotationRangeMax,
        velocity: motorSettings.velocity,
        acceleration: motorSettings.acceleration,
        deceleration: motorSettings.deceleration,
        period: motorSettings.period,
        visible: motorSettings.visible,
        invert: motorSettings.invert,
    };
}
