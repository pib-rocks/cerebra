export class Bricklet {
    uid: string;
    brickletNumber: number;

    constructor(uid: string, brickletNumber: number) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
    }

    static fromDTO(dto: {uid: string; brickletNumber: number}): Bricklet {
        return new Bricklet(dto.uid, dto.brickletNumber);
    }
}
