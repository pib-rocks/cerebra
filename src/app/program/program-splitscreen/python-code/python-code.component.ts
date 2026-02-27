import {Component, Input} from "@angular/core";

@Component({
    standalone: false,
    selector: "app-python-code",
    templateUrl: "./python-code.component.html",
    styleUrls: ["./python-code.component.scss"],
})
export class PythonCodeComponent {
    @Input() code = "";
}
