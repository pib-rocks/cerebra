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
        velocity: number,
        acceleration: number,
        deceleration: number,
        period: number,
        pulse_width_min: number,
        pulse_width_max: number,
        rotation_range_min: number,
        rotation_range_max: number,
        turnedOn: boolean,
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
            motorName !== settings.motorName ||
            this.turnedOn !== settings.turnedOn ||
            this.pulse_width_max !== +settings.pulse_widths_max! ||
            this.pulse_width_min !== +settings.pulse_widths_min! ||
            this.rotation_range_max !== +settings.rotation_range_max! ||
            this.rotation_range_min !== +settings.rotation_range_min! ||
            this.velocity !== +settings.velocity! ||
            this.acceleration !== +settings.acceleration! ||
            this.deceleration !== +settings.deceleration! ||
            this.period !== +settings.period!
        ) {
            return false;
        }

        return true;
    }

    public getChecked(settingsCopy: MotorSettings) {
        if (
            settingsCopy.velocity !== this.velocity ||
            settingsCopy.acceleration !== this.acceleration ||
            settingsCopy.deceleration !== this.deceleration ||
            settingsCopy.period !== this.period ||
            settingsCopy.pulse_width_min !== this.pulse_width_min ||
            settingsCopy.pulse_width_max !== this.pulse_width_max ||
            settingsCopy.rotation_range_min !== this.rotation_range_min ||
            settingsCopy.rotation_range_max !== this.rotation_range_max ||
            settingsCopy.effort !== this.effort
        ) {
            return false;
        }
        return true;
    }
}
