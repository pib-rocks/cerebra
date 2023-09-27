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

    constructor(
        velocity: number,
        acceleration: number,
        deceleration: number,
        period: number,
        pulse_width_min: number,
        pulse_width_max: number,
        rotation_range_min: number,
        rotation_range_max: number,
    ) {
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.period = period;
        this.pulse_width_min = pulse_width_min;
        this.pulse_width_max = pulse_width_max;
        this.rotation_range_min = rotation_range_min;
        this.rotation_range_max = rotation_range_max;
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
            this.rotation_range_max
        );
    }

    public getChecked(settingsCopy: MotorSettings) {
        if (
            settingsCopy.velocity == this.velocity ||
            settingsCopy.acceleration == this.acceleration ||
            settingsCopy.deceleration == this.deceleration ||
            settingsCopy.period == this.period ||
            settingsCopy.pulse_width_min == this.pulse_width_min ||
            settingsCopy.pulse_width_max == this.pulse_width_max ||
            settingsCopy.rotation_range_min == this.rotation_range_min ||
            settingsCopy.rotation_range_max == this.rotation_range_max ||
            settingsCopy.effort == this.effort
        ) {
            return true;
        }
        return false;
    }
}
