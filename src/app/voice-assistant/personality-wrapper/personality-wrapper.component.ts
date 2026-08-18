import {Component, ChangeDetectionStrategy} from "@angular/core";
import {RouterOutlet} from "@angular/router";

@Component({
    selector: "app-personality-wrapper",
    templateUrl: "./personality-wrapper.component.html",
    styleUrls: ["./personality-wrapper.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet],
})
export class PersonalityWrapperComponent {}
