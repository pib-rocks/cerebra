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
        
    static getMotorSettings(motorSettings){
        return new MotorSettings(motorSettings.name, motorSettings.turnedOn, motorSettings.pulseWidthMin, motorSettings.pulseWidthMax, motorSettings.rotationRangeMin, motorSettings.rotationRangeMax, motorSettings.velocity, motorSettings.acceleration, motorSettings.deceleration, motorSettings.period, motorSettings.visible)
    }
}
export default MotorSettings