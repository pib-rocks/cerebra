import {Component, ElementRef, ViewChild} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../blockly";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {asyncScheduler} from "rxjs";
import {ITheme} from "blockly/core/theme";

import {customBlockDefinition} from "../program-blocks/custom-blocks";
import {pythonGenerator} from "../program-generators/custom-generators";

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

    readonly customTheme: ITheme = Blockly.Theme.defineTheme("customTheme", {
        base: Blockly.Themes.Classic,
        name: "transparentBackground",
        componentStyles: {
            workspaceBackgroundColour: "transparent",
            toolboxBackgroundColour: "transparent",
            flyoutBackgroundColour: "#314969",
        },
    });

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
            theme: this.customTheme,
        });

        customBlockDefinition();

        this.observer = new ResizeObserver(() => {
            this.resizeBlockly();
        });
        this.programService.getAllPrograms().subscribe((_) => {
            this.route.params.subscribe((params) => {
                const programNumber = params["uuid"];
                this.programService
                    .getCodeByProgramNumber(programNumber)
                    .subscribe((code) => {
                        this.workspaceContent = JSON.parse(code.visual);
                    });
            });
        });
        this.workspace.trashcan?.flyout
            ?.getWorkspace()
            .addChangeListener(this.flyoutChangeCallback);
        this.workspace.addChangeListener(this.flyoutChangeCallback);
        const blocklyMainBackground: SVGRectElement | null =
            document.querySelector(".blocklyMainBackground");
        if (blocklyMainBackground) {
            blocklyMainBackground.style.stroke = "none";
        }
    }

    ngAfterViewInit() {
        this.observer.observe(this.blocklyDiv.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer.unobserve(this.blocklyDiv.nativeElement);
        Blockly.registry.unregister("theme", "customtheme");
    }

    resizeBlockly() {
        Blockly.svgResize(this.workspace);
    }

    saveCode() {
        const programNumber = this.route.snapshot.params["uuid"];
        const code = {
            visual: JSON.stringify(this.workspaceContent),
            python: pythonGenerator.workspaceToCode(this.workspace),
        };
        this.programService.updateCodeByProgramNumber(programNumber, code);

        console.log(code.python);
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
