import {Component, OnInit, ChangeDetectionStrategy} from "@angular/core";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {NgClass} from "@angular/common";
import {MotorSettingsComponent} from "./motor-settings/motor-settings.component";
import {MotorCurrentComponent} from "./motor-current/motor-current.component";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        NgClass,
        MotorSettingsComponent,
        MotorCurrentComponent,
        RouterOutlet,
    ],
})
export class JointControlCoreComponent implements OnInit {
    joint!: JointConfiguration;
    selectedMotor!: any;
    displayMotors: MotorConfiguration[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.joint = data["joint"];
            this.displayMotors = [];
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
