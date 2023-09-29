import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject} from "rxjs";
import {Motor} from "./types/motor.class";
import {Group} from "./types/motor.enum";
import {Message} from "./message";
import * as ROSLIB from "roslib";
import {MotorSettingsMessage} from "./motorSettingsMessage";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    private sliderMessageTopic!: ROSLIB.Topic;
    leftFingers = [
        {name: "thumb_left_stretch", label: "Thumb"},
        {name: "thumb_left_opposition", label: "Thumb opposition"},
        {name: "index_left_stretch", label: "Index finger"},
        {name: "middle_left_stretch", label: "Middle finger"},
        {name: "ring_left_stretch", label: "Ring finger"},
        {name: "pinky_left_stretch", label: "Pinky finger"},
    ];
    rightFingers = [
        {name: "thumb_right_stretch", label: "Thumb"},
        {name: "thumb_right_opposition", label: "Thumb opposition"},
        {name: "index_right_stretch", label: "Index finger"},
        {name: "middle_right_stretch", label: "Middle finger"},
        {name: "ring_right_stretch", label: "Ring finger"},
        {name: "pinky_right_stretch", label: "Pinky finger"},
    ];
    leftArm = [
        {name: "upper_arm_left_rotation", label: "Upper arm rotation"},
        {name: "elbow_left", label: "Elbow Position"},
        {name: "lower_arm_left_rotation", label: "Lower arm rotation"},
        {name: "wrist_left", label: "Wrist Position"},
        {name: "shoulder_vertical_left", label: "Shoulder Vertical"},
        {name: "shoulder_horizontal_left", label: "Shoulder Horizontal"},
    ];
    rightArm = [
        {name: "upper_arm_right_rotation", label: "Upper arm rotation"},
        {name: "elbow_right", label: "Elbow Position"},
        {name: "lower_arm_right_rotation", label: "Lower arm rotation"},
        {name: "wrist_right", label: "Wrist Position"},
        {name: "shoulder_vertical_right", label: "Shoulder Vertical"},
        {name: "shoulder_horizontal_right", label: "Shoulder Horizontal"},
    ];
    head = [
        {name: "tilt_forward_motor", label: "Tilt Forward"},
        {name: "tilt_sideways_motor", label: "Tilt Sideways"},
        {name: "turn_head_motor", label: "Head Rotation"},
    ];

    motors: Motor[] = [];

    constructor(private rosService: RosService) {
        this.subscribeMotorValueSubject();
        this.createMotors();
    }

    createMotors() {
        for (const s of this.leftFingers) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.left_hand,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.rightFingers) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.right_hand,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.leftArm) {
            this.motors.push(
                new Motor(s.name, 0, Group.left_arm, s.label, undefined).init(),
            );
        }
        for (const s of this.rightArm) {
            this.motors.push(
                new Motor(
                    s.name,
                    0,
                    Group.right_arm,
                    s.label,
                    undefined,
                ).init(),
            );
        }
        for (const s of this.head) {
            this.motors.push(
                new Motor(s.name, 0, Group.head, s.label, undefined).init(),
            );
        }
    }

    printAllMotors() {
        for (const m of this.motors) {
            console.log(m.toString());
        }
    }

    public getMotorsByGroup(group: Group): Motor[] {
        return this.motors.filter((m) => m.group === group);
    }
    public getMotorsByGroupNoOpposition(group: Group): Motor[] {
        return this.getMotorsByGroup(group).filter(
            (m: Motor) => !m.name.includes("opposition"),
        );
    }
    public getMotorByName(name: string): Motor {
        return this.motors.find((m) => m.name === name)!;
    }
    public getMotorByHardwareId(hwId: string): Motor | undefined {
        return this.motors.find((m) => m.hardware_id === hwId);
    }
    public getMotorByTurnedOn(turned_on: boolean): Motor[] {
        return this.motors.filter((m) => m.settings.turnedOn === turned_on);
    }
    public getMotorSubjectByName(
        name: string,
    ): BehaviorSubject<Motor> | undefined {
        return this.motors.find((m) => m.name === name)?.motorSubject;
    }

    public updateMotorFromComponent(motorCopy: Motor) {
        const motor = this.getMotorByName(motorCopy.name);
        this.sendMessage(motorCopy);

        //deprecated: can be removed once components are refactored to use JT and Setting only
        if (motor!.updateChangedAttribute(motorCopy)) {
            const message = motor!.parseMotorToMessage();
            //Werte sanitize
            this.sendSliderMessage(message);
            motor!.motorSubject.next(motor!);
        }
    }

    public sendDummyMessageForGroup(group: Group) {
        for (const motor of this.motors) {
            if (motor.group === group) {
                this.rosService.sendSliderMessage({
                    motor: motor.name,
                    currentValue: Math.floor(Math.random() * 2000),
                });
            }
        }
    }

    sendSliderMessage(msg: Message) {
        const json = JSON.parse(JSON.stringify(msg));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const message = new ROSLIB.Message({data: JSON.stringify(parameters)});
        this.sliderMessageTopic?.publish(message);
        console.log("Sent message " + JSON.stringify(message));
    }

    sendMessage(motorCopy: Motor) {
        const motor = this.getMotorByName(motorCopy.name);
        if (motor) {
            if (motor.position !== motorCopy.position) {
                this.rosService.sendJointTrajectoryMessage(
                    motor.parseMotorToJointTrajectoryMessage(),
                );
            }
            if (!motor.settings.getChecked(motorCopy.settings)) {
                this.rosService.sendMotorSettingsMessage({
                    motorName: motor.name,
                    turnedOn: motor.settings.turnedOn,
                    pulse_widths_min: "" + motor.settings.pulse_width_min,
                    pulse_widths_max: "" + motor.settings.pulse_width_max,
                    rotation_range_min: "" + motor.settings.rotation_range_min,
                    rotation_range_max: "" + motor.settings.rotation_range_max,
                    velocity: "" + motor.settings.velocity,
                    acceleration: "" + motor.settings.acceleration,
                    deceleration: "" + motor.settings.deceleration,
                    period: "" + motor.settings.period,
                } as MotorSettingsMessage);
            }
        }
    }

    // Later with PR-253
    // subscribeCurrentReceiver(): Subscription {
    //     return this.rosService.currentReceiver$.subscribe(
    //         (message: MotorCurrentMessage) => {
    //             console.log(message);
    //             console.log(message["motor"]);
    //             for (const motor of this.motors) {
    //                 if (motor.name === message.motor) {
    //                     // console.log(message);
    //                     motor.subject.next(message.currentValue);
    //                 }
    //             }
    //         },
    //     );
    // }

    subscribeMotorValueSubject() {
        this.rosService.motorValueSubject.subscribe((message: Message) => {
            this.updateMotorFromMessage(message);
        });
    }

    updateMotorFromMessage(message: Message) {
        const motor = this.getMotorByName(message.motor);
        motor?.updateMotorFromRosMessage(message);
        const copy = motor?.clone();
        motor?.motorSubject.next(copy!);
    }

    getMotorHandNames(str: string) {
        return [];
    }
}
