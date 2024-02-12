export class MotorSettings{
    constructor(name, turnedOn, pulseWidthMin, pulseWidthMax, rotationRangeMin, rotationRangeMax, velocity, acceleration, deceleration, period, visible){
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
    }
        
    static getMotorSettings(m){
        return new MotorSettings(m.name, m.turnedOn, m.pulseWidthMin, m.pulseWidthMax, m.rotationRangeMin, m.rotationRangeMax, m.velocity, m.acceleration, m.deceleration, m.period, m.visible)
    }
}
export default MotorSettings