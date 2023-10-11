import {MotorSettingsMessage} from "../motorSettingsMessage";

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
    turnedOn: boolean;

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
        this.turnedOn = turnedOn;
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
            this.turnedOn
        );
    }

    // Forbidden non null assertion will be resolved when all components are using new way of passing Data by setting the interface MotorSettingsMessage to required attributes
    public equalMotorSettingsMessage(
        motorName: string,
        settings: MotorSettingsMessage,
    ) {
        if (
            motorName !== settings.motor_name ||
            this.turnedOn !== settings.turned_on ||
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

    public updateMotorSettingsFromMotorSettingsMessage(
        message: MotorSettingsMessage,
    ) {
        this.turnedOn = message.turned_on;
        this.pulse_width_max = message.pulse_width_max;
        this.pulse_width_min = message.pulse_width_min;
        this.rotation_range_max = message.rotation_range_max;
        this.rotation_range_min = message.rotation_range_min;
        this.velocity = message.velocity;
        this.acceleration = message.acceleration;
        this.deceleration = message.deceleration;
        this.period = message.period;
    }

    public equals(settingsCopy: MotorSettings) {
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
            settingsCopy.turnedOn == this.turnedOn
        ) {
            return true;
        }
        return false;
    }

    public updateChangedAttribute(settingsCopy: MotorSettings) {
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
            this.turnedOn = settingsCopy.turnedOn;
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
            this.turnedOn,
        );
    }
}
