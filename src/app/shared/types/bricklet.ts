export class Bricklet {
    uid: string;
    brickletNumber: number;
    type: string;

    constructor(uid: string, brickletNumber: number, type: string) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
        this.type = type;
    }

    static fromDTO(dto: {
        uid: string;
        brickletNumber: number;
        type: string;
    }): Bricklet {
        return new Bricklet(dto.uid, dto.brickletNumber, dto.type);
    }
}
