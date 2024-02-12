import Bricklet from "./bricklet.mjs"

export class Motor{
    constructor(name, turnedOn, pulseWidthMin, pulseWidthMax, rotationRangeMin, rotationRangeMax, velocity, acceleration, deceleration, period, visible, bricklet){
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
        this.bricklet = bricklet
    }

    static getMotor(m, b){
        let arrModifiedBricklet = [];
        b.forEach(b => {
            arrModifiedBricklet.push(Bricklet.getBricklet(b));
        });
        return new Motor(m.name, m.turnedOn, m.pulseWidthMin, m.pulseWidthMax, m.rotationRangeMin, m.rotationRangeMax, m.velocity, m.acceleration, m.deceleration, m.period, m.visible, arrModifiedBricklet)
    }
}
export default Motor