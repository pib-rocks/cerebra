import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {ProgramOutputLine} from "src/app/shared/types/program-output-line";
import {ProgramService} from "src/app/shared/services/program.service";
import {ProgramCode} from "src/app/shared/types/program-code";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

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

    ExecutionState = ExecutionState;

    codePython: string = "";
    codeVisualOld: string = "{}";
    codeVisualNew: string = "{}";
    programNumber: string = "";
    flyoutWidth: number = 0;

    inSplitMode: boolean = false;

    output$: Observable<ProgramOutputLine[]> = new Observable();
    state$: Observable<ProgramState> = new Observable();
    executionState: ExecutionState = ExecutionState.NOT_STARTED;

    readonly PLAY = "../../assets/program/button-run-play.svg";
    readonly STOP = "../../assets/program/button-run-stop.svg";
    readonly TOGGLE_LEFT = "../../assets/toggle-switch-left.png";
    readonly TOGGLE_RIGHT = "../../assets/toggle-switch-right.png";
    readonly SAVE_ACTIVE = "../../assets/program/button-save-active.svg";
    readonly SAVE_INACTIVE = "../../assets/program/button-save-inactive.svg";
    readonly FULL_SCREEN = "../../../../assets/program/icon-full-screen.svg";
    readonly SPLIT_SCREEN = "../../../../assets/program/icon-split-screen.svg";

    ngOnInit(): void {
        this.activatedRoute.data.subscribe((data) => {
            this.codeVisualOld = (data["code"] as ProgramCode).codeVisual;
            this.codeVisualNew = this.codeVisualOld;
        });
        this.activatedRoute.params.subscribe((params) => {
            this.programNumber = params["program-number"];
            this.output$ = this.programService.getProgramOutput(
                this.programNumber,
            );
            this.state$ = this.programService.getProgramState(
                this.programNumber,
            );
            this.state$.subscribe(
                (state) => (this.executionState = state.executionState),
            );
        });
    }

    saveCode() {
        this.programService.updateCodeByProgramNumber(this.programNumber, {
            codeVisual: this.codeVisualNew,
        });
        this.codeVisualOld = this.codeVisualNew;
    }

    runProgram() {
        this.saveCode();
        this.inSplitMode = true;
        if (this.executionState === ExecutionState.STARTING) {
            return;
        } else if (this.executionState === ExecutionState.RUNNING) {
            this.programService.terminateProgram(this.programNumber);
        } else {
            this.programService.runProgram(this.programNumber);
        }
    }
}
