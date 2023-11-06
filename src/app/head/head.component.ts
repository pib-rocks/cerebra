import {Component, OnInit} from "@angular/core";
import {MotorService} from "../shared/services/motor.service";
import {Group} from "../shared/types/motor.enum";
import {Motor} from "../shared/types/motor.class";

@Component({
    selector: "app-head",
    templateUrl: "./head.component.html",
    styleUrls: ["./head.component.css"],
})
export class HeadComponent implements OnInit {
    motors?: Motor[];
    constructor(private motorService: MotorService) {}

    ngOnInit(): void {
        this.motors = this.motorService.getMotorsByGroup(Group.head);
    }
    reset() {
        this.motorService.resetMotorGroupPosition(Group.head);
    }
}
