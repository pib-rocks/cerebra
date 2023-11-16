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
import {BehaviorSubject} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FormControl, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {Program} from "../shared/types/program";

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

    subject: BehaviorSubject<Program[]> = new BehaviorSubject<Program[]>([
        new Program(
            "102a598b-b205-40a2-959c-6f449eed9d89",
            "Hand tracking",
            "Hand tracking",
        ),
        new Program(
            "182a598b-b205-40a2-959c-6f449eed9d89",
            "Face recognition",
            "Hand recognition",
        ),
    ]);
    programIcon: string = "";
    nameFormControl: FormControl = new FormControl("");

    constructor(
        public dialog: MatDialog,
        private modalService: NgbModal,
        private router: Router,
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
