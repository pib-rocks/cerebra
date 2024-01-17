import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {Motor} from "../../shared/types/motor.class";
import {Group} from "../../shared/types/motor.enum";

@Component({
    selector: "app-right-arm",
    templateUrl: "./arm.component.html",
    styleUrls: ["./arm.component.css"],
})
export class ArmComponent implements OnInit {
    side!: string;
    motors!: Motor[];
    displayCurrentMotors!: string[];
    sortOrderDisplayCurrentMotors: string[] = [
        "upper",
        "elbow",
        "lower",
        "wrist",
        "vertical",
        "horizontal",
    ];

    constructor(
        private route: ActivatedRoute,
        private motorService: MotorService,
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.side = params["side"];
            this.motors =
                this.side === "left"
                    ? this.motorService.getMotorsByGroup(Group.left_arm)
                    : this.motorService.getMotorsByGroup(Group.right_arm);
        });
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
    }

    reset() {
        this.motorService.resetMotorGroupPosition(this.motors[0].group);
    }
}
