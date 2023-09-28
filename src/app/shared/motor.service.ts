import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject} from "rxjs";
import {Motor} from "./types/motor.class";
import {Group} from "./types/motor.enum";
import {Message} from "./message";
import * as ROSLIB from "roslib";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    private sliderMessageTopic!: ROSLIB.Topic;
    leftFingers = [
        "thumb_left_stretch",
        "thumb_left_opposition",
        "index_left_stretch",
        "middle_left_stretch",
        "ring_left_stretch",
        "pinky_left_stretch",
    ];
    rightFingers = [
        "thumb_right_stretch",
        "thumb_right_opposition",
        "index_right_stretch",
        "middle_right_stretch",
        "ring_right_stretch",
        "pinky_right_stretch",
    ];
    leftArm = [
        "upper_arm_left_rotation",
        "elbow_left",
        "lower_arm_left_rotation",
        "wrist_left",
    ];
    rightArm = [
        "upper_arm_right_rotation",
        "elbow_right",
        "lower_arm_right_rotation",
        "wrist_right",
    ];

    head = ["tilt_forward_motor", "tilt_sideways_motor", "turn_head_motor"];

    motors: Motor[] = [];

    constructor(private rosService: RosService) {
        this.subscribeMotorValueSubject();
        this.createMotors();
        this.printAllMotors();
    }

    //Defaultinit
    createMotors() {
        for (const s of this.leftFingers) {
            this.motors.push(
                new Motor(s, 0, Group.left_hand, undefined, undefined).init(),
            );
        }
        for (const s of this.rightFingers) {
            this.motors.push(
                new Motor(s, 0, Group.right_hand, undefined, undefined).init(),
            );
        }
        for (const s of this.leftArm) {
            this.motors.push(
                new Motor(s, 0, Group.left_arm, undefined, undefined).init(),
            );
        }
        for (const s of this.rightArm) {
            this.motors.push(
                new Motor(s, 0, Group.right_arm, undefined, undefined).init(),
            );
        }
        for (const s of this.head) {
            this.motors.push(
                new Motor(s, 0, Group.head, undefined, undefined).init(),
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
    public getMotorByName(name: string): Motor | undefined {
        return this.motors.find((m) => m.name === name);
    }
    public getMotorByHardwareId(hwId: string): Motor | undefined {
        return this.motors.find((m) => m.hardware_id === hwId);
    }
    public getMotorByTurnedOn(turned_on: boolean): Motor[] {
        return this.motors.filter((m) => m.turned_on === turned_on);
    }
    public getMotorSubjectByName(
        name: string,
    ): BehaviorSubject<Motor> | undefined {
        return this.motors.find((m) => m.name === name)?.motorSubject;
    }

    public updateMotorFromComponent(motorCopy: Motor) {
        const motor = this.getMotorByName(motorCopy.name);
        if (motor!.updateChangedAttribute(motorCopy)) {
            const message = this.parseMotorToMessage(motor!);
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

    parseMotorToMessage(motor: Motor): Message {
        return {
            motor: motor.name,
            value: "" + motor.position,
            turnedOn: motor.turned_on,
            pule_widths_max: "" + motor.settings.pulse_width_max,
            pule_widths_min: "" + motor.settings.pulse_width_min,
            velocity: "" + motor.settings.velocity,
            rotation_range_max: "" + motor.settings.rotation_range_max,
            rotation_range_min: "" + motor.settings.rotation_range_min,
            deceleration: "" + motor.settings.deceleration,
            acceleration: "" + motor.settings.acceleration,
            period: "" + motor.settings.period,
        } as Message;
    }

    sendSliderMessage(msg: Message) {
        const json = JSON.parse(JSON.stringify(msg));
        const parameters = Object.keys(json).map((key) => ({[key]: json[key]}));
        const message = new ROSLIB.Message({data: JSON.stringify(parameters)});
        this.sliderMessageTopic?.publish(message);
        console.log("Sent message " + JSON.stringify(message));
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
