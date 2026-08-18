import {Component, ChangeDetectionStrategy} from "@angular/core";
import {joints} from "../shared/types/joint-configuration";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";

@Component({
    selector: "app-joint-control",
    templateUrl: "./joint-control.component.html",
    styleUrls: ["./joint-control.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLinkActive, RouterLink, RouterOutlet],
})
export class JointControlComponent {
    joints = joints;
}
