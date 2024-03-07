import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {ProgramCode} from "src/app/shared/types/program-code";

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
    codeVisual: string = "";
    programNumber: string = "";

    flyoutWidth: number = 0;

    saveBtnDisabled: boolean = true;
    viewMode: boolean = false;

    imgSrc: string = "../../assets/toggle-switch-left.png";
    runButtonPath: string = "../../assets/program/run.svg";
    saveButtonPath: string = "../../assets/program/save.svg";

    ngOnInit(): void {
        this.activatedRoute.data.subscribe((data) => {
            this.codeVisual = (data["code"] as ProgramCode).visual;
            console.info("code visual: + " + this.codeVisual);
        });
        this.activatedRoute.params.subscribe((params) => {
            this.programNumber = params["program-number"];
            console.info(this.programNumber);
        });
    }

    saveCode() {
        console.info(
            "saving: " +
                this.codeVisual +
                " to " +
                this.programNumber +
                " with code: " +
                this.codePython,
        );
        this.programService
            .updateCodeByProgramNumber(this.programNumber, {
                visual: this.codeVisual,
                python: this.codePython,
            })
            .subscribe(() => console.info("hui"));
        this.saveBtnDisabled = true;
    }

    runProgram() {
        console.info("run program clicked");
    }

    changeViewMode() {
        this.viewMode = !this.viewMode;
    }

    onCodePythonChange(codePython: string) {
        this.codePython = codePython;
    }

    onCodeVIsualChange(codeVisual: string) {
        this.codeVisual = codeVisual;
        this.saveBtnDisabled = false;
    }

    onTrashcanFlyoutChange(flyoutWidth: number) {
        this.flyoutWidth = flyoutWidth;
    }
}
