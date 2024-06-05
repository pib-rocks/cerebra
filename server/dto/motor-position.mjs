export class MotorPosition {
    constructor(
        motorname,
        position
    ) {
        this.motorname = motorname;
        this.position = position;
    }

    static getMotorPosition(motorPosition) {
        return new MotorPosition(motorPosition.motorname, motorPosition.position);
    }
}
export default MotorPosition;
