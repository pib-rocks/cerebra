import {MotorSettingsMessage} from "../ros-message-types/motorSettingsMessage";

export class MotorSettings {
    velocity: number;
    acceleration: number;
    deceleration: number;
    effort?: number;
    period: number;
    pulse_width_min: number;
    pulse_width_max: number;
    rotation_range_min: number;
    rotation_range_max: number;
    turned_on: boolean;

    constructor(
        velocity: number = 0,
        acceleration: number = 0,
        deceleration: number = 0,
        period: number = 0,
        pulse_width_min: number = 0,
        pulse_width_max: number = 65535,
        rotation_range_min: number = -9000,
        rotation_range_max: number = 9000,
        turnedOn: boolean = true,
    ) {
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.period = period;
        this.pulse_width_min = pulse_width_min;
        this.pulse_width_max = pulse_width_max;
        this.rotation_range_min = rotation_range_min;
        this.rotation_range_max = rotation_range_max;
        this.turned_on = turnedOn;
    }

    toString(): string {
        return (
            "Velocity: " +
            this.velocity +
            "\nAcceleration: " +
            this.acceleration +
            "\nDeceleration: " +
            this.deceleration +
            "\nPeriod: " +
            this.period +
            "\nPulse Width min: " +
            this.pulse_width_min +
            "\nPulse Width max: " +
            this.pulse_width_max +
            "\nRotation Range min: " +
            this.rotation_range_min +
            "\nRotation Range max: " +
            this.rotation_range_max +
            "\nTurnedOn: " +
            this.turned_on
        );
    }

    public equalMotorSettingsMessage(
        motorName: string,
        settings: MotorSettingsMessage,
    ) {
        if (
            motorName !== settings.motor_name ||
            this.turned_on !== settings.turned_on ||
            this.pulse_width_max !== settings.pulse_width_max ||
            this.pulse_width_min !== settings.pulse_width_min ||
            this.rotation_range_max !== settings.rotation_range_max ||
            this.rotation_range_min !== settings.rotation_range_min ||
            this.velocity !== settings.velocity ||
            this.acceleration !== settings.acceleration ||
            this.deceleration !== settings.deceleration ||
            this.period !== settings.period
        ) {
            return false;
        }

        return true;
    }

    public equals(settingsCopy: MotorSettings | MotorSettingsMessage) {
        if (
            settingsCopy.velocity == this.velocity &&
            settingsCopy.acceleration == this.acceleration &&
            settingsCopy.deceleration == this.deceleration &&
            settingsCopy.period == this.period &&
            settingsCopy.pulse_width_min == this.pulse_width_min &&
            settingsCopy.pulse_width_max == this.pulse_width_max &&
            settingsCopy.rotation_range_min == this.rotation_range_min &&
            settingsCopy.rotation_range_max == this.rotation_range_max &&
            settingsCopy.effort == this.effort &&
            settingsCopy.turned_on == this.turned_on
        ) {
            return true;
        }
        return false;
    }

    public updateChangedAttribute(
        settingsCopy: MotorSettings | MotorSettingsMessage,
    ) {
        if (!this.equals(settingsCopy)) {
            this.velocity = settingsCopy.velocity;
            this.acceleration = settingsCopy.acceleration;
            this.deceleration = settingsCopy.deceleration;
            this.period = settingsCopy.period;
            this.pulse_width_min = settingsCopy.pulse_width_min;
            this.pulse_width_max = settingsCopy.pulse_width_max;
            this.rotation_range_min = settingsCopy.rotation_range_min;
            this.rotation_range_max = settingsCopy.rotation_range_max;
            this.effort = settingsCopy.effort;
            this.turned_on = settingsCopy.turned_on;
            return true;
        }
        return false;
    }

    public clone(): MotorSettings {
        return new MotorSettings(
            this.velocity,
            this.acceleration,
            this.deceleration,
            this.period,
            this.pulse_width_min,
            this.pulse_width_max,
            this.rotation_range_min,
            this.rotation_range_max,
            this.turned_on,
        );
    }
}
