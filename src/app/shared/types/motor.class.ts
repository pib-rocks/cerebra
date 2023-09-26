class MotorSettings {
    velocity: number;
    acceleration: number;
    effort?: number;
    period: number;
    pulse_width_min: number;
    pulse_width_max: number;
    rotation_range_min: number;
    rotation_range_max: number;

    constructor(
        velocity: number,
        acceleration: number,
        period: number,
        pulse_width_min: number,
        pulse_width_max: number,
        rotation_range_min: number,
        rotation_range_max: number,
    ) {
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.period = period;
        this.pulse_width_max = pulse_width_max;
        this.pulse_width_min = pulse_width_min;
        this.rotation_range_min = rotation_range_min;
        this.rotation_range_max = rotation_range_max;
    }
}

class Motor {
    name: string;
    position: number;
    hardware_id?: string;
    settings: MotorSettings;

    constructor(
        name: string,
        position: number,
        settings: MotorSettings,
        hardware_id?: string,
    ) {
        this.name = name;
        this.position = position;
        this.settings = settings;
        this.hardware_id = hardware_id;
    }
}
