import {Component, OnInit} from "@angular/core";
import {JointConfiguration} from "../joint-configuration/joint-configuration";
import {ActivatedRoute} from "@angular/router";
import {MotorConfiguration} from "../joint-configuration/motor-configuration";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.css"],
})
export class JointControlCoreComponent implements OnInit {
    joint!: JointConfiguration;

    selectedMotor?: MotorConfiguration = undefined;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.joint = data["joint"];
            console.info("data:  " + this.joint.image);
        });
    }

    selectMotor(motor: MotorConfiguration): void {
        this.selectedMotor = motor;
    }
}
