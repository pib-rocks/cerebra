export class MotorPosition {
    constructor(motorName, position) {
        this.motorName = motorName;
        this.position = position;
    }

    static getMotorPosition(motorPosition) {
        return new MotorPosition(
            motorPosition.motorName,
            motorPosition.position,
        );
    }
}
export default MotorPosition;
