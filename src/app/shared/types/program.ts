import {SidebarElement} from "../interfaces/sidebar-element.interface";

export class Program implements SidebarElement {
    name: string;
    programNumber: string;

    constructor(name: string, programNumber: string = "") {
        this.name = name;
        this.programNumber = programNumber;
    }

    getName(): string {
        return this.name;
    }

    getUUID(): string {
        return this.programNumber;
    }

    clone(): Program {
        return new Program(this.name, this.programNumber);
    }
}
