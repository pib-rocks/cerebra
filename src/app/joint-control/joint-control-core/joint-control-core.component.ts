import {Component, OnInit} from "@angular/core";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute, Router} from "@angular/router";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.css"],
})
export class JointControlCoreComponent implements OnInit {
    joint!: JointConfiguration;
    selectedMotor!: any;
    displayMotors: MotorConfiguration[] = new Array();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.joint = data["joint"];
            this.displayMotors = new Array();
            this.selectedMotor = undefined;
            this.displayMotors = this.joint.motors.filter(
                (motor) => !motor.isMultiMotor,
            );
        });
    }

    selectMotor(motor: any) {
        this.router.navigate(["motor", motor.motorPathName], {
            relativeTo: this.route,
        });
        this.selectedMotor = motor;
    }
}
