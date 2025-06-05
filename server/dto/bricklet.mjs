export class Bricklet {
    constructor(uid, brickletNumber, type) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
        this.type = type;
    }
 
    static getBricklet(brick) {
        return new Bricklet(brick.uid, brick.brickletNumber, brick.type);
    }
}
export default Bricklet;
