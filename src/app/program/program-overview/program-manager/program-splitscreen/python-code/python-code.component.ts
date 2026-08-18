import {Component, Input, ChangeDetectionStrategy} from "@angular/core";
import {Highlight} from "ngx-highlightjs";

@Component({
    selector: "app-python-code",
    templateUrl: "./python-code.component.html",
    styleUrls: ["./python-code.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [Highlight],
})
export class PythonCodeComponent {
    @Input() code = "";
}
