import {Component, OnInit} from "@angular/core";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute} from "@angular/router";
import {MotorService} from "src/app/shared/services/motor.service";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.css"],
})
export class JointControlCoreComponent implements OnInit {
    joint!: JointConfiguration;
    selectedMotorName: string = "";

    constructor(
        private route: ActivatedRoute,
        private motorService: MotorService,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.selectedMotorName = "";
            this.joint = data["joint"];
        });
        this.motorService.selectedMotorName.subscribe((selectedMotorName) => {
            this.selectedMotorName = selectedMotorName;
        });
    }
}
