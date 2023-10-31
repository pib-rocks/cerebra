import {Injectable} from "@angular/core";
import {RosService} from "./ros.service";
import {BehaviorSubject, Subscription} from "rxjs";
import {DiagnosticStatus} from "./rosMessageTypes/DiagnosticStatus.message";
import {MotorService} from "./motor.service";
import {Motor} from "./types/motor.class";

// probably decrepit with service refactoring
export interface CurrentMotor {
    name: string;
    subject: BehaviorSubject<any>;
}

// Mock Service, should be updated once service-refactoring (PR-287) is done
@Injectable({
    providedIn: "root",
})
export class MotorCurrentService {
    motorCurrentConsumptionTopicSubscription: Subscription;
    motors: CurrentMotor[] = [];

    constructor(
        private rosService: RosService,
        private motorService: MotorService,
    ) {
        this.motorCurrentConsumptionTopicSubscription =
            this.subscribeCurrentReceiver();
        this.createMotors();
    }
    createMotors() {
        const actMotors: Motor[] = this.motorService.motors;
        actMotors.forEach((m) => {
            this.motors.push({
                name: m.name,
                subject: new BehaviorSubject<number>(0),
            });
        });
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
