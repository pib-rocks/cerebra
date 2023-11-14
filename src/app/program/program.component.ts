import {
    AfterViewInit,
    OnInit,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    TemplateRef,
} from "@angular/core";
import * as Blockly from "blockly";
import {MatDialog} from "@angular/material/dialog";
import {DialogContentComponent} from "./dialog-content/dialog-content.component";
import {toolbox} from "./blockly";
import {BehaviorSubject, Observable} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from "@angular/router";
import {Program} from "../shared/types/program";
import {SidebarElement} from "../shared/interfaces/sidebar-element.interface";
import {ProgramService} from "../shared/services/program.service";

@Component({
    selector: "app-program",
    templateUrl: "./program.component.html",
    styleUrls: ["./program.component.css"],
})
export class ProgramComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    closeResult!: string;
    workspace: any;
    json: any;

    observer!: ResizeObserver;
    @ViewChild("blocklyDiv") blocklyDiv!: ElementRef<HTMLDivElement>;

    subject!: Observable<SidebarElement[]>;
    programIcon: string = "";
    nameFormControl: FormControl = new FormControl("");

    route!: ActivatedRoute;

    currentProgram!: Program;

    constructor(
        public dialog: MatDialog,
        private modalService: NgbModal,
        private router: Router,
        private programService: ProgramService,
    ) {}

    openDialog() {
        this.json = Blockly.serialization.workspaces.save(this.workspace);
        const dialogRef = this.dialog.open(DialogContentComponent, {
            data: {
                name: this.json,
            },
        });
        dialogRef.afterClosed().subscribe(() => {
            console.log("");
        });
    }

    toolbox: string = toolbox;

    ngOnInit(): void {
        this.subject = this.programService.programsSubject;
        this.nameFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
        this.workspace = Blockly.inject("blocklyDiv", {
            toolbox: this.toolbox,
        });
        this.observer = new ResizeObserver(() => {
            this.resizeBlockly();
        });

        this.router.routerState.root.children.forEach((child) =>
            child.url
                .subscribe((url) => {
                    if (url[0].path == "program" && child.firstChild) {
                        this.route = child.firstChild;
                    }
                })
                .unsubscribe(),
        );

        this.route.params.subscribe((param) => {
            const programNumber: string = param["uuid"];
            this.currentProgram = this.programService.getProgram(programNumber);
            const programContent = JSON.parse(this.currentProgram.program);
            Blockly.serialization.workspaces.load(
                programContent,
                this.workspace,
            );
        });
    }

    ngAfterViewInit() {
        this.observer.observe(this.blocklyDiv.nativeElement);
    }

    resizeBlockly() {
        Blockly.svgResize(this.workspace);
    }

    ngOnDestroy(): void {
        this.observer.unobserve(this.blocklyDiv.nativeElement);
    }

    showModal = (uuid?: string) => {
        return this.modalService
            .open(this.modalContent, {
                ariaLabelledBy: "modal-basic-title",
                size: "sm",
                windowClass: "myCustomModalClass",
                backdropClass: "myCustomBackdropClass",
            })
            .result.then(
                (result) => {
                    console.log(`Closed with: ${result}`);
                },
                () => {
                    if (uuid) {
                        this.editProgram();
                    } else {
                        this.addProgram();
                    }
                },
            );
    };

    openAddModal = () => {
        this.showModal();
    };

    openEditModal = () => {
        const uuid = "";
        this.showModal(uuid);
    };

    deleteProgram = () => {};

    editProgram() {
        return;
    }

    addProgram() {
        return;
    }

    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/program/program-add.svg",
            label: "ADD",
            clickCallback: this.openAddModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/program/program-delete.svg",
            label: "DELETE",
            clickCallback: this.deleteProgram,
        },
        {
            icon: "../../assets/voice-assistant-svgs/program/program-edit.svg",
            label: "EDIT",
            clickCallback: this.openEditModal,
        },
    ];
}
