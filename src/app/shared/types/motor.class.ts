import {BehaviorSubject} from "rxjs";
import {MotorSettings} from "./motor-settings.class";
import {Group} from "./motor.enum";
import {Message} from "../message";

export class Motor {
    name: string;
    position: number;
    hardware_id?: string;
    settings: MotorSettings;
    group: Group;
    turned_on: boolean;
    motorSubject: BehaviorSubject<Motor>;

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
        this.motorSubject = new BehaviorSubject<Motor>({} as Motor);
    }

    public init(): Motor {
        this.motorSubject.next(this.clone());
        return this;
    }

    public updateChangedAttribute(motorCopy: Motor): boolean | void {
        if (this.getChecked(motorCopy)) {
            this.position = motorCopy.position;
            this.settings = motorCopy.settings;
            this.turned_on = motorCopy.turned_on;
            return true;
        }
        return false;
    }

    public toString(): string {
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

    public clone(): Motor {
        const name = "" + this.name;
        const position = "0" + this.position;
        const group = this.group;
        const turned_on = true && this.turned_on;
        const settings = this.settings;
        return new Motor(name, +position, group, settings, turned_on);
    }

    public updateMotorFromRosMessage(message: Message) {
        this.position = !!message.value ? +message.value : this.position;
        this.turned_on = !!message.turnedOn ? message.turnedOn : this.turned_on;
        this.settings.acceleration = !!message.acceleration
            ? +message.acceleration
            : this.settings.acceleration;
        this.settings.deceleration = !!message.deceleration
            ? +message.deceleration
            : this.settings.deceleration;
        this.settings.pulse_width_max = !!message.pule_widths_max
            ? +message.pule_widths_max
            : this.settings.pulse_width_max;
        this.settings.pulse_width_min = !!message.pule_widths_min
            ? +message.pule_widths_min
            : this.settings.pulse_width_min;
        this.settings.velocity = !!message.velocity
            ? +message.velocity
            : this.settings.velocity;
        this.settings.period = !!message.period
            ? +message.period
            : this.settings.period;
        this.settings.rotation_range_max = !!message.rotation_range_max
            ? +message.rotation_range_max
            : this.settings.rotation_range_max;
        this.settings.rotation_range_min = !!message.rotation_range_min
            ? +message.rotation_range_min
            : this.settings.rotation_range_max;
    }

    private getChecked(motorCopy: Motor): boolean {
        if (
            motorCopy.name == this.name ||
            motorCopy.position == this.position ||
            motorCopy.hardware_id == this.hardware_id ||
            motorCopy.turned_on == this.turned_on ||
            this.settings.getChecked(motorCopy.settings)
        ) {
            return true;
        }
        return false;
    }

    private createDefaultSettings(): MotorSettings {
        return new MotorSettings(0, 0, 0, 0, 0, 65535, -9000, 9000);
    }
}
