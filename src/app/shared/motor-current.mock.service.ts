import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {DiagnosticStatus} from "./DiagnosticStatus.message";

// probably decrepit with service refactoring
export interface CurrentMotor {
    name: string;
    group: string;
    subject: BehaviorSubject<any>;
}

// Mock Service, should be updated once service-refactoring (PR-287) is done
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

    //MOCK --- Eventually get motors from motorservice
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
    }

    public sendDummyMessageForGroup(group: string) {
        for (const motor of this.motors) {
            if (motor.group === group) {
                this.rosService.sendSliderMessage({
                    motor: motor.name,
                    currentValue: Math.floor(Math.random() * 2000),
                });
            }
        }
    }

    public getMotorSubjectByName(
        name: string | undefined,
    ): BehaviorSubject<any> | undefined {
        return this.motors.find((m) => m.name === name)?.subject;
    }

    subscribeCurrentReceiver(): Subscription {
        return this.rosService.currentReceiver$.subscribe(
            (message: DiagnosticStatus) => {
                for (const motor of this.motors) {
                    if (motor.name === message.name) {
                        motor.subject.next(message.values[0].value);
                    }
                }
            },
        );
    }
}
