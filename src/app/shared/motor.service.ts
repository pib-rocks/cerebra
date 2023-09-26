import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject} from "rxjs";
import {Motor} from "./types/motor.class";
import {Group} from "./types/motor.enum";
import {Message} from "./message";

@Injectable({
    providedIn: "root",
})
export class MotorService {
    // motorCurrentConsumptionTopicSubscription: Subscription;

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
        // this.motorCurrentConsumptionTopicSubscription =
        //     this.subscribeCurrentReceiver();
        this.subscribeMotorValueSubject();
        this.createMotors();
        this.printAllMotors();
    }

    //Defaultinit
    createMotors() {
        for (const s of this.leftFingers) {
            this.motors.push(
                new Motor(s, 0, Group.left_hand, undefined, undefined),
            );
        }
        for (const s of this.rightFingers) {
            this.motors.push(
                new Motor(s, 0, Group.right_hand, undefined, undefined),
            );
        }
        for (const s of this.leftArm) {
            this.motors.push(
                new Motor(s, 0, Group.left_arm, undefined, undefined),
            );
        }
        for (const s of this.rightArm) {
            this.motors.push(
                new Motor(s, 0, Group.right_arm, undefined, undefined),
            );
        }
        for (const s of this.head) {
            this.motors.push(new Motor(s, 0, Group.head, undefined, undefined));
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

    public updateMotorFromComponent(motor: Motor) {
        //Vergleich incoming motor und bestehendem Motor
        //Werte sanitize
        //Änderungen anpassen
        //rostopic message senden
        //Subject.next(upgedateter bestehender Motor)
    }
    public updateMotorFromRos(motor: Motor) {
        //Vergleich incoming motor und bestehendem Motor
        //Änderungen anpassen
        //Subject.next(upgedateter bestehender Motor)
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

    // public getMotorSubjectByName(
    //     name: string | undefined,
    // ): BehaviorSubject<any> | null {
    //     const foundMotors = this.motors.filter((m) => m.name === name);
    //     if (foundMotors.length != 1) {
    //         console.warn(
    //             name +
    //                 " is " +
    //                 (foundMotors.length > 1
    //                     ? "ambigous"
    //                     : "not a registered Motor"),
    //         );
    //         return null;
    //     }
    //     // console.log(foundMotors);
    //     return foundMotors.map((m) => m.subject)[0];
    // }

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
        if (motor != undefined) {
            motor.position = !!message.value ? +message.value : motor.position;
            motor.turned_on = !!message.turnedOn
                ? message.turnedOn
                : motor.turned_on;
            motor.settings.acceleration = !!message.acceleration
                ? +message.acceleration
                : motor.settings.acceleration;
            motor.settings.deceleration = !!message.deceleration
                ? +message.deceleration
                : motor.settings.deceleration;
            motor.settings.pulse_width_max = !!message.pule_widths_max
                ? +message.pule_widths_max
                : motor.settings.pulse_width_max;
            motor.settings.pulse_width_min = !!message.pule_widths_min
                ? +message.pule_widths_min
                : motor.settings.pulse_width_min;
            motor.settings.velocity = !!message.velocity
                ? +message.velocity
                : motor.settings.velocity;
            motor.settings.period = !!message.period
                ? +message.period
                : motor.settings.period;
            motor.settings.rotation_range_max = !!message.rotation_range_max
                ? +message.rotation_range_max
                : motor.settings.rotation_range_max;
            motor.settings.rotation_range_min = !!message.rotation_range_min
                ? +message.rotation_range_min
                : motor.settings.rotation_range_max;
        }
        const copy = motor?.clone();
        motor?.motorSubject.next(copy!);
    }

    getMotorHandNames(str: string) {
        return [];
    }
}
