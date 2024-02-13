import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {JointConfiguration} from "../shared/types/joint-configuration";

@Component({
    selector: "app-joint-control",
    templateUrl: "./joint-control.component.html",
    styleUrls: ["./joint-control.component.css"],
})
export class JointControlComponent {
    joint!: JointConfiguration;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.joint = this.route.snapshot.data["joint"];
    }
}
