import {MotorSettingsMessage} from "../rosMessageTypes/motorSettingsMessage";

export class MotorSettings {
    velocity: number;
    acceleration: number;
    deceleration: number;
    effort?: number;
    period: number;
    pulseWidthMin: number;
    pulseWidthMax: number;
    rotationRangeMin: number;
    rotationRangeMax: number;
    turnedOn: boolean;

    constructor(
        velocity: number = 0,
        acceleration: number = 0,
        deceleration: number = 0,
        period: number = 0,
        pulseWidthMin: number = 0,
        pulseWidthMax: number = 65535,
        rotationRangeMin: number = -9000,
        rotationRangeMax: number = 9000,
        turnedOn: boolean = true,
    ) {
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.period = period;
        this.pulseWidthMin = pulseWidthMin;
        this.pulseWidthMax = pulseWidthMax;
        this.rotationRangeMin = rotationRangeMin;
        this.rotationRangeMax = rotationRangeMax;
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
            this.pulseWidthMin +
            "\nPulse Width max: " +
            this.pulseWidthMax +
            "\nRotation Range min: " +
            this.rotationRangeMin +
            "\nRotation Range max: " +
            this.rotationRangeMax +
            "\nturnedOn: " +
            this.turnedOn
        );
    }

    public equalMotorSettingsMessage(
        motorName: string,
        settings: MotorSettingsMessage,
    ) {
        if (
            motorName !== settings.name ||
            this.turnedOn !== settings.turnedOn ||
            this.pulseWidthMax !== settings.pulseWidthMax ||
            this.pulseWidthMin !== settings.pulseWidthMin ||
            this.rotationRangeMax !== settings.rotationRangeMax ||
            this.rotationRangeMin !== settings.rotationRangeMin ||
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
            settingsCopy.effort == this.effort
        ) {
            if (settingsCopy instanceof MotorSettings) {
                if (
                    settingsCopy.pulseWidthMin == this.pulseWidthMin &&
                    settingsCopy.pulseWidthMax == this.pulseWidthMax &&
                    settingsCopy.rotationRangeMin == this.rotationRangeMin &&
                    settingsCopy.rotationRangeMax == this.rotationRangeMax &&
                    settingsCopy.turnedOn == this.turnedOn
                ) {
                    return true;
                }
            } else if (
                settingsCopy.pulseWidthMin == this.pulseWidthMin &&
                settingsCopy.pulseWidthMax == this.pulseWidthMax &&
                settingsCopy.rotationRangeMin == this.rotationRangeMin &&
                settingsCopy.rotationRangeMax == this.rotationRangeMax &&
                settingsCopy.turnedOn == this.turnedOn
            ) {
                return true;
            }
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
            this.effort = settingsCopy.effort;
            if (settingsCopy instanceof MotorSettings) {
                this.pulseWidthMin = settingsCopy.pulseWidthMin;
                this.pulseWidthMax = settingsCopy.pulseWidthMax;
                this.rotationRangeMin = settingsCopy.rotationRangeMin;
                this.rotationRangeMax = settingsCopy.rotationRangeMax;
                this.turnedOn = settingsCopy.turnedOn;
            } else {
                this.pulseWidthMin = settingsCopy.pulseWidthMin;
                this.pulseWidthMax = settingsCopy.pulseWidthMax;
                this.rotationRangeMin = settingsCopy.rotationRangeMin;
                this.rotationRangeMax = settingsCopy.rotationRangeMax;
                this.turnedOn = settingsCopy.turnedOn;
            }
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
            this.pulseWidthMin,
            this.pulseWidthMax,
            this.rotationRangeMin,
            this.rotationRangeMax,
            this.turnedOn,
        );
    }
}
