import {Component} from "@angular/core";
import {ProgramService} from "src/app/shared/services/program.service";

@Component({
    selector: "app-program-splitscreen",
    templateUrl: "./program-splitscreen.component.html",
    styleUrls: ["./program-splitscreen.component.css"],
})
export class ProgramSplitscreenComponent {
    constructor(private programService: ProgramService) {
        this.subscribeViewMode();
        this.subscribePythonCode();
    }
    pythonCode: string = "";
    splitscreenMode: boolean = false;

    subscribeViewMode() {
        this.programService.viewModeSubject.subscribe((mode) => {
            this.splitscreenMode = mode;
        });
    }
    subscribePythonCode() {
        this.programService.pythonCodeSubject.subscribe((code) => {
            this.pythonCode = code;
        });
    }
}
