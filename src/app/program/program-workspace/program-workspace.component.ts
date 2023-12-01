import {
    Component,
    ElementRef,
    Output,
    ViewChild,
    EventEmitter,
} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../blockly";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {OutputConnection} from "blockly/core/renderers/measurables/output_connection";

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
                const program =
                    this.programService.getProgramFromCache(programNumber);
                this.workspaceContent = program?.program;
            });
        });
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
}
