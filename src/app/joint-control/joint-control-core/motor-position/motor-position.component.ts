import {Component, Input, OnInit} from "@angular/core";
import {MotorService} from "src/app/shared/services/motor.service";

@Component({
    selector: "app-motor-position",
    templateUrl: "./motor-position.component.html",
    styleUrls: ["./motor-position.component.css"],
})
export class MotorPositionComponent implements OnInit {
    @Input() motorName!: string;
    @Input() iconLeft!: string;
    @Input() iconRight!: string;

    constructor(private motorService: MotorService) {}

    ngOnInit() {
        console.info("init");
    }
}
