import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {Motor} from "./types/motor.class";
import {Group} from "./types/motor.enum";

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

    getMotorHandNames(str: string) {
        return [];
    }
}
