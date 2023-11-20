import {SidebarElement} from "../interfaces/sidebar-element.interface";

export interface ProgramDTO {
    name: string;
    programNumber?: string;
    program: string;
}

export class Program implements SidebarElement {
    name: string;
    program: object;
    programNumber: string;

    constructor(
        name: string,
        program: object = {},
        programNumber: string = "",
    ) {
        this.name = name;
        this.programNumber = programNumber;
        this.program = program;
    }

    getName(): string {
        return this.name;
    }

    getUUID(): string {
        return this.programNumber;
    }

    clone(): Program {
        return new Program(
            this.name,
            JSON.parse(JSON.stringify(this.program)),
            this.programNumber,
        );
    }

    static fromDTO(dto: ProgramDTO) {
        return new Program(
            dto.name,
            JSON.parse(dto.program),
            dto.programNumber ?? "",
        );
    }

    toDTO(includeNumber: boolean = true): ProgramDTO {
        return {
            name: this.name,
            program: JSON.stringify(this.program),
            programNumber: includeNumber ? this.programNumber : undefined,
        };
    }
}
