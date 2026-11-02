import {Component, ChangeDetectionStrategy} from "@angular/core";
import {joints} from "../shared/types/joint-configuration";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";

@Component({
    selector: "app-movement",
    templateUrl: "./movement.component.html",
    styleUrls: ["./movement.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLinkActive, RouterLink, RouterOutlet],
})
export class MovementComponent {
    joints = joints;
}
