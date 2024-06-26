import {Component} from "@angular/core";
import {joints} from "../shared/types/joint-configuration";

@Component({
    selector: "app-joint-control",
    templateUrl: "./joint-control.component.html",
    styleUrls: ["./joint-control.component.scss"],
})
export class JointControlComponent {
    joints = joints;
}
