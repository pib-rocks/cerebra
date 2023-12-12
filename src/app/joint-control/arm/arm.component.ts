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
    }
    reset() {
        this.motorService.resetMotorGroupPosition(this.motors[0].group);
    }
}
