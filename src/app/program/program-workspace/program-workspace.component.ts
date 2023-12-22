import {Component, ElementRef, ViewChild} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../blockly";
import {ActivatedRoute} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {asyncScheduler} from "rxjs";
import {ITheme} from "blockly/core/theme";
import {pythonGenerator} from "blockly/python";

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

    supportedEvents = new Set([
        Blockly.Events.BLOCK_CHANGE,
        Blockly.Events.BLOCK_CREATE,
        Blockly.Events.BLOCK_DELETE,
        Blockly.Events.BLOCK_MOVE,
    ]);

    generateCode(event: Event) {
        if (this.workspace.isDragging()) return;
        if (!this.supportedEvents.has(event.type)) return;
        this.pythonCode = pythonGenerator.workspaceToCode(this.workspace);
        console.log("coding...");
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
        this.workspace.trashcan?.flyout
            ?.getWorkspace()
            .addChangeListener(this.flyoutChangeCallback);
        this.workspace.addChangeListener(this.flyoutChangeCallback);
        const blocklyMainBackground: SVGRectElement | null =
            document.querySelector(".blocklyMainBackground");
        if (blocklyMainBackground) {
            blocklyMainBackground.style.stroke = "none";
        }
        this.workspace.addChangeListener((event: Event) => {
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
