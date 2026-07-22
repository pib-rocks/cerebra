import {Component, Input, ChangeDetectionStrategy} from "@angular/core";

@Component({
    selector: "app-python-code",
    templateUrl: "./python-code.component.html",
    styleUrls: ["./python-code.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class PythonCodeComponent {
    @Input() code = "";
}
