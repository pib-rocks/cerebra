import {Inject, Injectable, OnDestroy, OnInit} from "@angular/core";
import {MotorCurrentMessage} from "./currentMessage";
import {RosService} from "./ros.service";
import {BehaviorSubject, Subscription} from "rxjs";

export interface CurrentMotor {
    name: string;
    group: string;
    subject: BehaviorSubject<any>;
}

@Injectable({
    providedIn: "root",
})
export class MotorCurrentService {
    motorCurrentConsumptionTopicSubscription: Subscription;

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
    motors: CurrentMotor[] = [];

    constructor(private rosService: RosService) {
        this.motorCurrentConsumptionTopicSubscription =
            this.subscribeCurrentReceiver();
        this.createMotors();
    }

    //MOCK --- Eventually get motors from database
    createMotors() {
        for (const s of this.leftFingers) {
            this.motors.push({
                name: s,
                group: "left_hand",
                subject: new BehaviorSubject<number>(0),
            });
        }
        for (const s of this.rightFingers) {
            this.motors.push({
                name: s,
                group: "right_hand",
                subject: new BehaviorSubject<number>(0),
            });
        }
        for (const s of this.leftArm) {
            this.motors.push({
                name: s,
                group: "left_arm",
                subject: new BehaviorSubject<number>(0),
            });
        }
        for (const s of this.rightArm) {
            this.motors.push({
                name: s,
                group: "right_arm",
                subject: new BehaviorSubject<number>(0),
            });
        }
        console.log(this.motors);
    }

    public sendDummyMessageForGroup(group: string) {
        for (const motor of this.motors) {
            if (motor.group === group) {
                motor.subject.next(Math.floor(Math.random() * 2000));
            }
        }
    }

    public getMotorSubjectByName(
        name: string | undefined,
    ): BehaviorSubject<any> | null {
        console.log("passed name " + name);
        console.log(this.motors);
        for (const x of this.motors) {
            if (x.name === name) {
                console.log(x);
            }
        }

        const foundMotors = this.motors.filter((m) => m.name === name);
        if (foundMotors.length != 1) {
            console.warn(
                name +
                    " is " +
                    (foundMotors.length > 1
                        ? "ambigous"
                        : "not a registered Motor"),
            );
            return null;
        }
        console.log(foundMotors);
        return foundMotors.map((m) => m.subject)[0];
    }

    subscribeCurrentReceiver(): Subscription {
        return this.rosService.currentReceiver$.subscribe(
            (message: MotorCurrentMessage) => {
                for (const motor of this.motors) {
                    if (motor.name === message.motor) {
                        motor.subject.next(message.currentValue);
                    }
                }
            },
        );
    }
}
