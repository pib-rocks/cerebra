import {Component, ElementRef, ViewChild} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../blockly";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {asyncScheduler} from "rxjs";

@Component({
    selector: "app-program-workspace",
    templateUrl: "./program-workspace.component.html",
    styleUrls: ["./program-workspace.component.css"],
})
export class ProgramWorkspaceComponent {
    observer!: ResizeObserver;
    @ViewChild("blocklyDiv") blocklyDiv!: ElementRef<HTMLDivElement>;

    workspace!: Blockly.WorkspaceSvg;
    toolbox: string = toolbox;

    currentProgramNumber?: string;

    flyoutWidth: number = 0;
    runButtonPath: string = "../../assets/program/run.svg";
    saveButtonPath: string = "../../assets/program/save.svg";

    get workspaceContent(): object {
        return Blockly.serialization.workspaces.save(this.workspace);
    }

    set workspaceContent(content: object | undefined) {
        Blockly.serialization.workspaces.load(content ?? {}, this.workspace);
    }

    constructor(
        private programService: ProgramService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.workspace = Blockly.inject("blocklyDiv", {
            toolbox: this.toolbox,
        });
        this.observer = new ResizeObserver(() => {
            this.resizeBlockly();
        });
        this.programService.getAllPrograms().subscribe((_) => {
            this.route.params.subscribe((params) => {
                const programNumber = params["uuid"];
                this.workspaceContent =
                    this.programService.getCodeByProgramNumber(programNumber);
            });
        });
        this.workspace.trashcan?.flyout
            ?.getWorkspace()
            .addChangeListener(this.flyoutChangeCallback);
        this.workspace.addChangeListener(this.flyoutChangeCallback);
    }

    ngAfterViewInit() {
        this.observer.observe(this.blocklyDiv.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer.unobserve(this.blocklyDiv.nativeElement);
    }

    resizeBlockly() {
        Blockly.svgResize(this.workspace);
    }

    saveProgram() {
        const toBeUpdated = this.programService.getProgramFromCache(
            this.route.snapshot.params["uuid"],
        );
        if (!toBeUpdated) return;
        toBeUpdated.program = this.workspaceContent;
        this.programService.updateProgramByProgramNumber(toBeUpdated);
    }

    runProgram() {
        console.log("run clicked!");
    }

    flyoutChangeCallback = () => {
        asyncScheduler.schedule(() => {
            const contentOpen = this.workspace.trashcan?.contentsIsOpen();
            this.flyoutWidth = contentOpen
                ? this.workspace.trashcan?.flyout?.getWidth() ?? 0
                : 0;
        });
    };
}
