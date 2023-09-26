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
    motorSubject: Subject<Motor>;

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
        this.motorSubject = new Subject<Motor>();
    }

    createDefaultSettings(): MotorSettings {
        return new MotorSettings(0, 0, 0, 0, 0, 65535, -9000, 9000);
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

    clone(): Motor {
        const name = "" + this.name;
        const position = "0" + this.position;
        const group = this.group;
        const turned_on = true && this.turned_on;
        const settings = this.settings;
        return new Motor(name, +position, group, settings, turned_on);
    }
}
