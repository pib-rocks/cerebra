import {Component, Input} from "@angular/core";

@Component({
    selector: "app-python-code",
    templateUrl: "./python-code.component.html",
    styleUrls: ["./python-code.component.css"],
})
export class PythonCodeComponent {
    @Input() code = "";
}
