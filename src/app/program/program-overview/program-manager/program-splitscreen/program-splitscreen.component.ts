import {Component, OnInit, ChangeDetectionStrategy} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {ProgramService} from "src/app/shared/services/program.service";
import {ProgramCode} from "src/app/shared/types/program-code";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";

@Component({
    selector: "app-program-splitscreen",
    templateUrl: "./program-splitscreen.component.html",
    styleUrls: ["./program-splitscreen.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class ProgramSplitscreenComponent implements OnInit {
    ExecutionState = ExecutionState;

    codePython: string = "";
    codeVisualOld: string = "{}";
    codeVisualNew: string = "{}";
    programNumber: string = "";
    programName: string = "";
    flyoutWidth: number = 0;

    inSplitMode: boolean = false;

    programLogs$: Observable<ProgramLogLine[]> = new Observable();
    programState$: Observable<ProgramState> = new Observable();
    executionState: ExecutionState = ExecutionState.NOT_STARTED;

    readonly PLAY = "../../assets/program/button-run-play.svg";
    readonly STOP = "../../assets/program/button-run-stop.svg";
    readonly TOGGLE_LEFT = "../../assets/toggle-switch-left.png";
    readonly TOGGLE_RIGHT = "../../assets/toggle-switch-right.png";
    readonly SAVE_ACTIVE = "../../assets/program/button-save-active.svg";
    readonly SAVE_INACTIVE = "../../assets/program/button-save-inactive.svg";
    readonly EXPORT = "../../assets/program/button-export.svg";
    readonly FULL_SCREEN = "../../../../assets/program/icon-full-screen.svg";
    readonly SPLIT_SCREEN = "../../../../assets/program/icon-split-screen.svg";

    constructor(
        private programService: ProgramService,
        private activatedRoute: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.activatedRoute.data.subscribe((data) => {
            this.codeVisualOld = (data["code"] as ProgramCode).codeVisual;
            this.codeVisualNew = this.codeVisualOld;
        });
        this.activatedRoute.params.subscribe((params) => {
            this.programNumber = params["program-number"];
            this.resolveProgramName(this.programNumber);
            this.programLogs$ = this.programService.getProgramLogs(
                this.programNumber,
            );
            this.programState$ = this.programService.getProgramState(
                this.programNumber,
            );
            this.programState$.subscribe(
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

    exportCode() {
        const rawName = this.programName || `program-${this.programNumber}`;
        const safeName = this.toSafeFileName(rawName);
        const filenameBase = safeName || `program_${this.programNumber}`;

        const exportData = {
            version: 1,
            type: "pib-blockly-program",
            name: rawName,
            codeVisual: this.codeVisualNew,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${filenameBase}_pib-blockly-program.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    private resolveProgramName(programNumber: string) {
        const cached = this.programService.getProgramFromCache(programNumber);
        if (cached) {
            this.programName = cached.name;
            return;
        }

        this.programService.getProgramByProgramNumber(programNumber).subscribe({
            next: (program) => (this.programName = program.name),
        });
    }

    private toSafeFileName(value: string): string {
        return value
            .trim()
            .replace(/[^a-zA-Z0-9-_]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();
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

    onProgramInputReceived(input: string) {
        this.programService.provideProgramInput(this.programNumber, input);
    }
}
