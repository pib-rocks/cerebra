import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";

export class MockElement implements SidebarElement {
    name: string;
    uuid: string;
    constructor(name: string, uuid: string) {
        this.name = name;
        this.uuid = uuid;
    }
    getName(): string {
        return this.name;
    }
    getUUID(): string {
        return this.uuid;
    }
}
