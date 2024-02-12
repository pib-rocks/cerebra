export class bricklet{
    constructor(uid, brickletNumber){
        this.uid = uid;
        this.brickletNumber = brickletNumber;
    }

    static getBricklet(brick){
        return new bricklet(brick.uid, brick.brickletNumber)
    }
}
export default bricklet