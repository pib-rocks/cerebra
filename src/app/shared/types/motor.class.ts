/* eslint-disable no-extra-boolean-cast */
import {BehaviorSubject} from "rxjs";
import {MotorSettings} from "./motor-settings.class";
import {Group} from "./motor.enum";
import {Message} from "../message";
import {MotorSettingsMessage} from "../motorSettingsMessage";
import {JointTrajectoryMessage} from "../rosMessageTypes/jointTrajectoryMessage";
import {createDefaultStdMessageHeader} from "../rosMessageTypes/stdMessageHeader";
import {
    JointTrajectoryPoint,
    createDefaultRosTime,
} from "../rosMessageTypes/jointTrajectoryPoint";
export class Motor {
    name: string;
    position: number;
    hardware_id?: string;
    settings: MotorSettings;
    group: Group;
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
            "\nSettings: " +
            this.settings.toString()
        );
    }

    public clone(): Motor {
        const name = "" + this.name;
        const position = "0" + this.position;
        const group = this.group;
        const settings = this.settings;
        return new Motor(name, +position, group, settings);
    }

    public updateMotorFromRosMessage(message: Message) {
        this.position = !!message.value ? +message.value : this.position;
        this.settings.turnedOn = !!message.turnedOn
            ? message.turnedOn
            : this.settings.turnedOn;
        this.settings.acceleration = !!message.acceleration
            ? +message.acceleration
            : this.settings.acceleration;
        this.settings.deceleration = !!message.deceleration
            ? +message.deceleration
            : this.settings.deceleration;
        this.settings.pulse_width_max = !!message.pulse_widths_max
            ? +message.pulse_widths_max
            : this.settings.pulse_width_max;
        this.settings.pulse_width_min = !!message.pulse_widths_min
            ? +message.pulse_widths_min
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
            this.settings.getChecked(motorCopy.settings)
        ) {
            return true;
        }
        return false;
    }

    private createDefaultSettings(): MotorSettings {
        return new MotorSettings(0, 0, 0, 0, 0, 65535, -9000, 9000, true);
    }

    parseMotorToMessage(): Message {
        return {
            motor: this.name,
            value: "" + this.position,
            turnedOn: this.settings.turnedOn,
            pule_widths_max: "" + this.settings.pulse_width_max,
            pule_widths_min: "" + this.settings.pulse_width_min,
            velocity: "" + this.settings.velocity,
            rotation_range_max: "" + this.settings.rotation_range_max,
            rotation_range_min: "" + this.settings.rotation_range_min,
            deceleration: "" + this.settings.deceleration,
            acceleration: "" + this.settings.acceleration,
            period: "" + this.settings.period,
        } as Message;
    }
    parseMotorToSettingsMessage(): MotorSettingsMessage {
        return {
            motorName: this.name,
            turnedOn: this.settings.turnedOn,
            pule_widths_max: "" + this.settings.pulse_width_max,
            pule_widths_min: "" + this.settings.pulse_width_min,
            velocity: "" + this.settings.velocity,
            rotation_range_max: "" + this.settings.rotation_range_max,
            rotation_range_min: "" + this.settings.rotation_range_min,
            deceleration: "" + this.settings.deceleration,
            acceleration: "" + this.settings.acceleration,
            period: "" + this.settings.period,
        } as MotorSettingsMessage;
    }
    parseMotorToJointTrajectoryMessage(): JointTrajectoryMessage {
        return {
            header: createDefaultStdMessageHeader(),
            joint_names: [this.name],
            points: [this.parseMotortoJointTrajectoryPoint()],
        } as JointTrajectoryMessage;
    }
    parseMotortoJointTrajectoryPoint(): JointTrajectoryPoint {
        return {
            positions: [this.position],
            velocities: [this.settings.velocity],
            accelerations: [this.settings.acceleration],
            effort: this.settings.effort ? [this.settings.effort] : undefined,
            time_from_start: createDefaultRosTime(),
        } as JointTrajectoryPoint;
    }
}
