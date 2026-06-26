export class ButtonProgram {
    constructor(brickletNumber, programNumber, brickletUid = null) {
        this.brickletNumber = brickletNumber;
        this.programNumber = programNumber;
        this.brickletUid = brickletUid;
    }

    static getButtonProgram(buttonProgram, brickletUid = null) {
        return new ButtonProgram(
            buttonProgram.brickletNumber,
            buttonProgram.programNumber,
            brickletUid || buttonProgram.brickletUid,
        );
    }
}
export default ButtonProgram;
