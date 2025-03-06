export interface BrickletDTO {
    uid: string;
    brickletNumber: number;
}

export class Bricklet {
    uid: string;
    brickletNumber: number;

    constructor(uid: string, brickletNumber: number) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
    }
}
