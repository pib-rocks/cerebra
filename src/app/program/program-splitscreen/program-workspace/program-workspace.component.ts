import {Component, ElementRef, ViewChild} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../../blockly";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {asyncScheduler} from "rxjs";
import {ITheme} from "blockly/core/theme";
import {pythonGenerator} from "../../program-generators/custom-generators";

import {customBlockDefinition} from "../../program-blocks/custom-blocks";
import {Abstract} from "blockly/core/events/events_abstract";

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
    splitscreenMode: boolean = this.programService.viewModeSubject.getValue();

    flyoutWidth: number = 0;
    imgSrc: string = "../../assets/toggle-switch-left.png";
    runButtonPath: string = "../../assets/program/run.svg";
    saveButtonPath: string = "../../assets/program/save.svg";

    pythonCode: string = "";

    cancelRunningProgram?: () => void = undefined;

    supportedEvents = new Set([
        Blockly.Events.BLOCK_CHANGE,
        Blockly.Events.BLOCK_CREATE,
        Blockly.Events.BLOCK_DELETE,
        Blockly.Events.BLOCK_MOVE,
    ]);

    generateCode(event: Abstract) {
        if (this.workspace.isDragging()) return;
        if (!this.supportedEvents.has(event.type)) return;
        this.pythonCode = pythonGenerator.workspaceToCode(this.workspace);
        this.programService.pythonCodeSubject.next(this.pythonCode);
    }

    changeViewMode() {
        if (this.splitscreenMode) {
            this.imgSrc = "../../assets/toggle-switch-left.png";
            this.splitscreenMode = false;
            this.programService.viewModeSubject.next(this.splitscreenMode);
        } else {
            this.imgSrc = "../../assets/toggle-switch-right.png";
            this.splitscreenMode = true;
            this.programService.viewModeSubject.next(this.splitscreenMode);
        }
    }

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
        this.workspace.addChangeListener((event: Abstract) => {
            this.generateCode(event);
        });
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
    }

    runProgram() {
        if (this.cancelRunningProgram) {
            console.info("cancelling...");
            this.cancelRunningProgram();
            this.cancelRunningProgram = undefined;
        } else {
            console.info("starting...");
            this.programService.runProgram("hui").subscribe((handle) => {
                handle.feedback.subscribe((feedback) =>
                    console.info(JSON.stringify(feedback)),
                );
                handle.status.subscribe((status) =>
                    console.warn(JSON.stringify(status)),
                );
                handle.result.subscribe((result) =>
                    console.error(JSON.stringify(result)),
                );
                this.cancelRunningProgram = handle.cancel;
            });
        }
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
