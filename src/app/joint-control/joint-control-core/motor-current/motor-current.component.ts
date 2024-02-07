import {Component, Input} from "@angular/core";

@Component({
    selector: "app-motor-current",
    templateUrl: "./motor-current.component.html",
    styleUrls: ["./motor-current.component.css"],
})
export class MotorCurrentComponent {
    @Input() motorName!: string;
}
