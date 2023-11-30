import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {MotorService} from "../shared/services/motor.service";
import {Motor} from "../shared/types/motor.class";
import {Group} from "../shared/types/motor.enum";
import {Observable, Subscription} from "rxjs";

@Component({
    selector: "app-right-arm",
    templateUrl: "./arm.component.html",
    styleUrls: ["./arm.component.css"],
})
export class ArmComponent implements OnInit {
    side!: string;
    motors!: Motor[];
    sub?: Subscription;
    subject?: Observable<Motor[]>;
    constructor(
        private route: ActivatedRoute,
        private motorService: MotorService,
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            if (this.sub) {
                this.sub.unsubscribe();
            }
            this.side = params["side"];
            this.subject =
                this.side === "left"
                    ? this.motorService.getActiveMotorsByGroup(Group.left_arm)
                    : this.motorService.getActiveMotorsByGroup(Group.right_arm);
            this.sub = this.subject.subscribe(
                (motors) => (this.motors = motors),
            );
        });
    }
    reset() {
        this.motorService.resetMotorGroupPosition(this.motors[0].group);
    }
}
