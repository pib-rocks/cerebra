import {Subject} from "rxjs";
import {MotorSettings} from "./motor-settings.class";
import {Group} from "./motor.enum";
// import {}

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

    toString(): string {
        return (
            "Name: " +
            this.name +
            "\nPosition: " +
            this.position +
            "\nHardware ID: " +
            this.hardware_id +
            "\nGroup: " +
            this.group +
            "\nTurnedOn: " +
            this.turned_on +
            "\nSettings: " +
            this.settings.toString()
        );
    }
}
