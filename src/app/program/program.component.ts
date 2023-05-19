import {
  AfterViewInit,
  OnInit,
  Component,
  ElementRef,
  Injectable,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import * as Blockly from "blockly";
import { MatDialog } from "@angular/material/dialog";
import { DialogContentComponent } from "./dialog-content/dialog-content.component";
import { toolbox } from "./blockly";

@Component({
  selector: "app-program",
  templateUrl: "./program.component.html",
  styleUrls: ["./program.component.css"],
})
export class ProgramComponent implements OnInit, OnDestroy, AfterViewInit {
  showFloatingMenu = false;
  closeResult!: string;
  workspace: any;
  json: any;

  observer!: ResizeObserver;
  @ViewChild("blocklyDiv") blocklyDiv!: ElementRef<HTMLDivElement>;

  showFloatingMenuItems() {
    this.showFloatingMenu = !this.showFloatingMenu;
  }

  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.json = Blockly.serialization.workspaces.save(this.workspace);
    const dialogRef = this.dialog.open(DialogContentComponent, {
      data: {
        name: this.json,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log("");
    });
  }

  toolbox: string = toolbox;

  ngOnInit(): void {
    this.workspace = Blockly.inject("blocklyDiv", {
      toolbox: this.toolbox,
    });
    this.observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
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
}
