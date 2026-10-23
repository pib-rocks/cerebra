import {MotorSettingsMessage} from "../ros-types/msg/motor-settings-message";
import {MotorDTO, MotorUpperEndpoint} from "./motor-dto";

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
    upperEndpoint: MotorUpperEndpoint;
}

export function resolveUpperEndpoint(source: {
    upperEndpoint?: MotorUpperEndpoint;
    invert?: boolean;
}): MotorUpperEndpoint {
    if (source.upperEndpoint === "min" || source.upperEndpoint === "max") {
        return source.upperEndpoint;
    }
    return source.invert === true ? "min" : "max";
}

export function fromMotorSettingsMessage(
    message: MotorSettingsMessage,
): MotorSettings {
    return {
        velocity: message.velocity,
        acceleration: message.acceleration,
        deceleration: message.deceleration,
        period: message.period,
        pulseWidthMin: message.pulse_width_min,
        pulseWidthMax: message.pulse_width_max,
        rotationRangeMin: message.rotation_range_min,
        rotationRangeMax: message.rotation_range_max,
        turnedOn: message.turned_on,
        visible: message.visible,
        upperEndpoint: resolveUpperEndpoint({
            upperEndpoint: message.upper_endpoint,
            invert: message.invert,
        }),
    };
}

export function fromMotorDTO(motor: MotorDTO): MotorSettings {
    return {
        velocity: motor.velocity,
        acceleration: motor.acceleration,
        deceleration: motor.deceleration,
        period: motor.period,
        pulseWidthMin: motor.pulseWidthMin,
        pulseWidthMax: motor.pulseWidthMax,
        rotationRangeMin: motor.rotationRangeMin,
        rotationRangeMax: motor.rotationRangeMax,
        turnedOn: motor.turnedOn,
        visible: motor.visible,
        upperEndpoint: resolveUpperEndpoint(motor),
    };
}
