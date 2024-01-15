import {Component, OnInit} from "@angular/core";
import {ProgramService} from "src/app/shared/services/program.service";

@Component({
    selector: "app-program-splitscreen",
    templateUrl: "./program-splitscreen.component.html",
    styleUrls: ["./program-splitscreen.component.css"],
})
export class ProgramSplitscreenComponent implements OnInit {
    constructor(private programService: ProgramService) {}

    pythonCode: string = "";
    splitscreenMode: boolean = false;

    ngOnInit(): void {
        this.subscribeViewMode();
        this.subscribePythonCode();
    }

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
