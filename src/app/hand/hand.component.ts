import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {MotorService} from "../shared/motor.service";
import {Motor} from "../shared/types/motor.class";
import {Group} from "../shared/types/motor.enum";

@Component({
    selector: "app-hand",
    templateUrl: "./hand.component.html",
    styleUrls: ["./hand.component.css"],
})
export class HandComponent implements OnInit {
    side!: string;
    motors!: Motor[];
    displayMotors!: Motor[];
    displayCurrentMotors!: string[];
    displayAllFingers!: boolean;
    sortOrderDisplayCurrentMotors: string[] = [
        "thumb",
        "opposition",
        "index",
        "middle",
        "ring",
        "pinky",
    ];
    oppositionMotor: Motor | undefined;

    constructor(
        private route: ActivatedRoute,
        private motorService: MotorService,
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.side = params["side"];
            this.motors =
                this.side === "left"
                    ? this.motorService.getMotorsByGroup(Group.left_hand)
                    : this.motorService.getMotorsByGroup(Group.right_hand);
            this.displayAllFingers = JSON.parse(
                localStorage.getItem(`cerebra-hand-${this.side}`) ?? "false",
            );
            this.displayMotors = this.displayAllFingers
                ? this.motors.filter((m) => !m.name.includes("all"))
                : this.motors.filter(
                      (m) =>
                          m.name.includes("all") ||
                          m.name.includes("opposition"),
                  );
            this.displayCurrentMotors = this.motors
                .filter((m) => !m.name.includes("all"))
                .map((m) => m.name);
            this.displayCurrentMotors.sort((m, n) => {
                let mIndex = this.sortOrderDisplayCurrentMotors.length;
                let nIndex = this.sortOrderDisplayCurrentMotors.length;
                this.sortOrderDisplayCurrentMotors.forEach(
                    (x: string, index: number) => {
                        mIndex = m.includes(x) ? index : mIndex;
                        nIndex = n.includes(x) ? index : nIndex;
                    },
                );
                return this.side === "left" ? mIndex - nIndex : nIndex - mIndex;
            });
        });
    }

    switchView() {
        if (this.displayAllFingers) {
            const allMotor = this.motors.find((m) => m.name.includes("all"));
            const indexMotor = this.motors.find((m) =>
                m.name.includes("index"),
            );
            if (allMotor && indexMotor) {
                allMotor.position = indexMotor.position;
                allMotor.settings = indexMotor.settings.clone();
                this.motorService.sendJointTrajectoryMessage(allMotor);
                this.motorService.sendMotorSettingsMessage(allMotor);
            }
        }
        this.displayAllFingers = !this.displayAllFingers;
        this.displayMotors = this.displayAllFingers
            ? this.motors.filter((m) => !m.name.includes("all"))
            : this.motors.filter(
                  (m) =>
                      m.name.includes("all") || m.name.includes("opposition"),
              );
        localStorage.setItem(
            `cerebra-hand-${this.side}`,
            String(this.displayAllFingers),
        );
    }

    reset() {
        this.motorService.resetMotorGroupPosition(this.motors[0].group);
    }
}
