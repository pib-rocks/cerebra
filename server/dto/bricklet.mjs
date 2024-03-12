export class Bricklet {
    constructor(uid, brickletNumber) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
    }

    static getBricklet(brick) {
        return new Bricklet(brick.uid, brick.brickletNumber);
    }
}
export default Bricklet;
