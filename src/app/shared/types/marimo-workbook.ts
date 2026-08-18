import {SidebarElement} from "../interfaces/sidebar-element.interface";

export class MarimoWorkbook implements SidebarElement {
    constructor(
        public name: string,
        public filename: string,
    ) {}

    getUUID(): string {
        return this.filename;
    }

    getName(): string {
        return this.name || this.filename.replace(".py", "").replace(/_/g, " ");
    }
}
