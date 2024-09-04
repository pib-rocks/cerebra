import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from "@angular/core";
import * as Blockly from "blockly";
import {toolbox} from "../../blockly";
import {ITheme} from "blockly/core/theme";
import {pythonGenerator} from "../../pib-blockly/program-generators/custom-generators";
import {customBlockDefinition} from "../../pib-blockly/program-blocks/custom-blocks";
import {Abstract} from "blockly/core/events/events_abstract";
import {GuardsCheckStart, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {PoseService} from "src/app/shared/services/pose.service";
import {Pose} from "src/app/shared/types/pose";

@Component({
    selector: "app-program-workspace",
    templateUrl: "./program-workspace.component.html",
    styleUrls: ["./program-workspace.component.scss"],
})
export class ProgramWorkspaceComponent
    implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
    routerEventSubscription!: Subscription;
    observer!: ResizeObserver;
    @ViewChild("blocklyDiv") blocklyDiv!: ElementRef<HTMLDivElement>;

    workspace!: Blockly.WorkspaceSvg;
    toolbox: string = toolbox;

    @Input() codeVisual: string = "{}";

    @Output() codePythonChange = new EventEmitter<string>();
    @Output() codeVisualChange = new EventEmitter<string>();
    @Output() trashcanFlyoutChange = new EventEmitter<number>();

    supportedEvents = new Set([
        Blockly.Events.BLOCK_CHANGE,
        Blockly.Events.BLOCK_CREATE,
        Blockly.Events.BLOCK_DELETE,
        Blockly.Events.BLOCK_MOVE,
    ]);

    readonly customTheme: ITheme = Blockly.Theme.defineTheme("customTheme", {
        base: Blockly.Themes.Classic,
        name: "transparentBackground",
        componentStyles: {
            workspaceBackgroundColour: "transparent",
            toolboxBackgroundColour: "#ffffff12",
            flyoutBackgroundColour: "#314969",
        },
    });

    constructor(
        private router: Router,
        private poseService: PoseService,
    ) {}

    get workspaceContent(): string {
        return JSON.stringify(
            Blockly.serialization.workspaces.save(this.workspace),
        );
    }
    set workspaceContent(content: string | undefined) {
        Blockly.serialization.workspaces.load(
            JSON.parse(content ?? "{}"),
            this.workspace,
        );
    }

    get codePython(): string {
        return pythonGenerator.workspaceToCode(this.workspace);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ("codeVisual" in changes && !changes["codeVisual"].isFirstChange()) {
            const codeVisual = changes["codeVisual"].currentValue;
            this.workspaceContent = codeVisual;
            this.codePythonChange.emit(this.codePython);
        }
    }

    ngOnInit() {
        this.routerEventSubscription = this.router.events.subscribe((event) => {
            if (event instanceof GuardsCheckStart) {
                this.codeVisualChange.emit(this.workspaceContent);
                Blockly.hideChaff();
            }
        });

        this.poseService.getPosesObservable().subscribe((poses) => {
            poses.length > 0
                ? this.updatePoseBlockDropdown(poses)
                : this.updatePoseBlockDropdown([
                      new Pose("no pose available", "NO POSE"),
                  ]);
        });

        this.workspace = Blockly.inject("blocklyDiv", {
            toolbox: this.toolbox,
            theme: this.customTheme,
        });

        customBlockDefinition();
        this.observer = new ResizeObserver(() => {
            this.resizeBlockly();
        });

        const trashWorkspace = this.workspace.trashcan?.flyout?.getWorkspace();
        trashWorkspace!.addChangeListener(this.flyoutChangeCallback);
        this.workspace.addChangeListener(this.flyoutChangeCallback);

        const blocklyMainBackground: SVGRectElement | null =
            document.querySelector(".blocklyMainBackground");
        if (blocklyMainBackground) {
            blocklyMainBackground.style.stroke = "none";
        }

        this.workspace.addChangeListener((event: Abstract) => {
            if (this.workspace.isDragging()) return;
            if (!this.supportedEvents.has(event.type)) return;
            this.codePythonChange.emit(this.codePython);
            this.codeVisualChange.emit(this.workspaceContent);
        });
    }

    ngAfterViewInit() {
        this.observer.observe(this.blocklyDiv.nativeElement);
        this.workspaceContent = this.codeVisual;
    }

    ngOnDestroy(): void {
        this.observer.unobserve(this.blocklyDiv.nativeElement);
        Blockly.registry.unregister("theme", "customtheme");
        this.routerEventSubscription.unsubscribe();
    }

    resizeBlockly() {
        Blockly.svgResize(this.workspace);
    }

    flyoutChangeCallback = () => {
        const contentOpen = this.workspace.trashcan?.contentsIsOpen();
        const flyoutWidth = contentOpen
            ? this.workspace.trashcan?.flyout?.getWidth() ?? 0
            : 0;
        this.trashcanFlyoutChange.emit(flyoutWidth);
    };

    updatePoseBlockDropdown(poses: Pose[]): void {
        const poseOptions = poses.map((pose) => [pose.name, pose.poseId]);
        Blockly.Blocks["move_to_pose"].getPoses = () => poseOptions;
        if (this.workspace) {
            this.workspaceContent = this.codeVisual;
        }
    }
}
