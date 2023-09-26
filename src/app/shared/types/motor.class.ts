import {Subject} from "rxjs";

export class Motor {
    name: string;
    position: number;
    hardware_id?: string;
    settings: MotorSettings;
    group: Group;
    turned_on: boolean;
    jtSubject: Subject<any>;
    settingsSubject: Subject<any>;

    constructor(
        name: string,
        position: number,
        group: Group,
        settings?: MotorSettings,
        turned_on?: boolean,
    ) {
        this.name = name;
        this.position = position;
        this.settings = !!settings ? settings : this.createDefaultSettings();
        this.group = group;
        this.turned_on = !!turned_on ? turned_on : true;
        this.jtSubject = new Subject<any>();
        this.settingsSubject = new Subject<any>();
    }

    createDefaultSettings(): MotorSettings {
        return new MotorSettings(0, 0, 0, 0, 65535, -9000, 9000);
    }
}
