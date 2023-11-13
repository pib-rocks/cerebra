import {
    AfterViewInit,
    OnInit,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
} from "@angular/core";
import * as Blockly from "blockly";
import {MatDialog} from "@angular/material/dialog";
import {DialogContentComponent} from "./dialog-content/dialog-content.component";
import {toolbox} from "./blockly";
import {Observable} from "rxjs";
import {ProgramElement} from "../shared/interfaces/program-element.interface";
import {FormControl} from "@angular/forms";

@Component({
    selector: "app-program",
    templateUrl: "./program.component.html",
    styleUrls: ["./program.component.css"],
})
export class ProgramComponent implements OnInit, OnDestroy, AfterViewInit {
    closeResult!: string;
    workspace: any;
    json: any;

    observer!: ResizeObserver;
    @ViewChild("blocklyDiv") blocklyDiv!: ElementRef<HTMLDivElement>;

    subject!: Observable<ProgramElement[]>;
    programIcon: string = "";
    nameFormControl: FormControl = new FormControl("");

    constructor(public dialog: MatDialog) {}

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

    openAddModal = () => {
        this.nameFormControl.setValue("");
        return;
        // this.showModal();
    };

    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/program/program-add.svg",
            label: "ADD",
            clickCallback: this.openAddModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/program/program-delete.svg",
            label: "DELETE",
            clickCallback: this.openAddModal,
            // clickCallback: this.deletePersonality,
        },
        {
            icon: "../../assets/voice-assistant-svgs/program/program-edit.svg",
            label: "EDIT",
            clickCallback: this.openAddModal,
            // clickCallback: this.openEditModal,
        },
    ];
}
