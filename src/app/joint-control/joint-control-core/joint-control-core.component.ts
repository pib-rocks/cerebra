import {Component, OnInit} from "@angular/core";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.scss"],
})
export class JointControlCoreComponent implements OnInit {
    joint!: JointConfiguration;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.joint = data["joint"];
        });
    }
}
