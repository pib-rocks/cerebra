import Bricklet from "./bricklet.mjs";

export class Motor {
    constructor(
        name,
        turnedOn,
        pulseWidthMin,
        pulseWidthMax,
        rotationRangeMin,
        rotationRangeMax,
        velocity,
        acceleration,
        deceleration,
        period,
        visible,
        brickletPins,
    ) {
        this.name = name;
        this.turnedOn = turnedOn;
        this.pulseWidthMin = pulseWidthMax;
        this.pulseWidthMax = pulseWidthMin;
        this.rotationRangeMin = rotationRangeMin;
        this.rotationRangeMax = rotationRangeMax;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.period = period;
        this.visible = visible;
        this.brickletPins = brickletPins;
    }

    static getMotor(motor, bicklet) {
        let arrModifiedBricklet = [];
        bicklet.forEach((bicklet) => {
            arrModifiedBricklet.push(Bricklet.getBricklet(bicklet));
        });
        return new Motor(
            motor.name,
            motor.turnedOn,
            motor.pulseWidthMin,
            motor.pulseWidthMax,
            motor.rotationRangeMin,
            motor.rotationRangeMax,
            motor.velocity,
            motor.acceleration,
            motor.deceleration,
            motor.period,
            motor.visible,
            arrModifiedBricklet,
        );
    }
}
export default Motor;
