export class ProgramCode {
    programNumber: string;
    code: {visual: string; python?: string};

    constructor(
        programNumber: string,
        code: {visual: string; python?: string} = {visual: "", python: ""},
    ) {
        this.programNumber = programNumber;
        this.code = code;
    }

    clone(): ProgramCode {
        return new ProgramCode(this.programNumber, {
            visual: this.code.visual,
            python: this.code.python,
        });
    }
}
