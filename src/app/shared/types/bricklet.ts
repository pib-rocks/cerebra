export type BrickletType = "Servo Bricklet" | "Solid State Relay Bricklet";
export class Bricklet {
    uid: string;
    brickletNumber: number;
    type: BrickletType;

    constructor(uid: string, brickletNumber: number, type: BrickletType) {
        this.uid = uid;
        this.brickletNumber = brickletNumber;
        this.type = type;
    }

    static fromDTO(dto: {
        uid: string;
        brickletNumber: number;
        type: BrickletType;
    }): Bricklet {
        return new Bricklet(dto.uid, dto.brickletNumber, dto.type);
    }
}
