import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {ProgramOutputLine} from "src/app/shared/ros-types/msg/program-output-line";
import {ProgramService} from "src/app/shared/services/program.service";
import {ProgramCode} from "src/app/shared/types/program-code";
import {ProgramState} from "src/app/shared/types/program-state";

@Component({
    selector: "app-program-splitscreen",
    templateUrl: "./program-splitscreen.component.html",
    styleUrls: ["./program-splitscreen.component.css"],
})
export class ProgramSplitscreenComponent implements OnInit {
    constructor(
        private programService: ProgramService,
        private activatedRoute: ActivatedRoute,
    ) {}

    codePython: string = "";
    codeVisualOld: string = "";
    codeVisualNew: string = "";
    programNumber: string = "";
    flyoutWidth: number = 0;

    viewMode: boolean = false;

    output: Observable<ProgramOutputLine[]> = new Observable();
    state: Observable<ProgramState> = new Observable();

    ngOnInit(): void {
        this.activatedRoute.data.subscribe((data) => {
            this.codeVisualOld = (data["code"] as ProgramCode).visual;
            this.codeVisualNew = this.codeVisualOld;
        });
        this.activatedRoute.params.subscribe((params) => {
            this.programNumber = params["program-number"];
            this.output = this.programService.getProgramOutput(
                this.programNumber,
            );
            this.state = this.programService.getProgramState(
                this.programNumber,
            );
        });
    }

    saveCode() {
        this.programService.updateCodeByProgramNumber(this.programNumber, {
            visual: this.codeVisualNew,
            python: this.codePython,
        });
        this.codeVisualOld = this.codeVisualNew;
    }

    runProgram() {
        this.programService.runProgram(this.programNumber);
    }

    changeViewMode() {
        this.viewMode = !this.viewMode;
    }

    onCodePythonChange(codePython: string) {
        this.codePython = codePython;
    }

    onCodeVIsualChange(codeVisual: string) {
        this.codeVisualNew = codeVisual;
    }

    onTrashcanFlyoutChange(flyoutWidth: number) {
        this.flyoutWidth = flyoutWidth;
    }
}
