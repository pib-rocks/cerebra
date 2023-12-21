/* eslint-disable prettier/prettier */
/* eslint-disable no-extra-boolean-cast */
import {BehaviorSubject} from "rxjs";
import {MotorSettings} from "./motor-settings.class";
import {Group} from "./motor.enum";
import {MotorSettingsMessage} from "../ros-message-types/motorSettingsMessage";
import {JointTrajectoryMessage} from "../ros-message-types/jointTrajectoryMessage";
import {createDefaultStdMessageHeader} from "../ros-message-types/stdMessageHeader";
import {
    JointTrajectoryPoint,
    createDefaultRosTime,
} from "../ros-message-types/jointTrajectoryPoint";
export class Motor {
    name: string;
    position: number;
    hardware_id?: string;
    settings: MotorSettings;
    group: Group;
    motorSubject: BehaviorSubject<Motor>;
    label: string;

    constructor(
        name: string,
        position: number,
        group: Group,
        label: string,
        settings?: MotorSettings,
    ) {
        this.name = name;
        this.position = position;
        this.settings = settings ?? this.createDefaultSettings();
        this.group = group;
        this.motorSubject = new BehaviorSubject<Motor>({} as Motor);
        this.label = label;
    }

    public init(): this {
        this.motorSubject.next(this.clone());
        return this;
    }

    public updateChangedAttribute(motorCopy: Motor): boolean | void {
        if (!this.equals(motorCopy)) {
            this.position = motorCopy.position;
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
        const name = this.name;
        const position = this.position;
        const group = this.group;
        const settings = this.settings.clone();
        const label = this.label;
        return new Motor(name, position, group, label, settings);
    }

    public updateMotorFromJointTrajectoryMessage(
        jtPoint: JointTrajectoryPoint,
    ) {
        this.position = jtPoint.positions[0];
    }

    private equals(motorCopy: Motor): boolean {
        if (
            motorCopy.name == this.name &&
            motorCopy.position == this.position &&
            motorCopy.hardware_id == this.hardware_id
        ) {
            return true;
        }
        return false;
    }

    private createDefaultSettings(): MotorSettings {
        return new MotorSettings(0, 0, 0, 0, 0, 65535, -9000, 9000, true);
    }

    parseMotorToSettingsMessage(): MotorSettingsMessage {
        return {
            motor_name: this.name,
            turned_on: this.settings.turnedOn,
            pulse_width_max: this.settings.pulseWidthMax,
            pulse_width_min: this.settings.pulseWidthMin,
            velocity: this.settings.velocity,
            rotation_range_max: this.settings.rotationRangeMax,
            rotation_range_min: this.settings.rotationRangeMin,
            deceleration: this.settings.deceleration,
            acceleration: this.settings.acceleration,
            period: this.settings.period,
            active: this.settings.active,
        };
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
