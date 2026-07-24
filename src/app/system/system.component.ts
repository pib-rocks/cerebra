import {Component, ChangeDetectionStrategy} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";

@Component({
    selector: "app-system",
    templateUrl: "./system.component.html",
    styleUrls: ["./system.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLinkActive, RouterLink, RouterOutlet],
})
export class SystemComponent {}
