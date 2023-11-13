import {ProgramElement} from "../interfaces/program-element.interface";

export class Program implements ProgramElement {
    programNumber: string;
    name: string;
    program: string;

    constructor(programNumber: string, name: string, program: string) {
        this.programNumber = programNumber;
        this.name = name;
        this.program = program;
    }

    getName(): string {
        return this.name;
    }
    getUUID(): string {
        return this.programNumber;
    }

    clone(): Program {
        return new Program(this.programNumber, this.name, this.program);
    }
}
