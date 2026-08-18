import {
    OnInit,
    Component,
    ViewChild,
    TemplateRef,
    AfterViewInit,
    ChangeDetectionStrategy,
} from "@angular/core";

import {Observable, Subject} from "rxjs";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {FormControl, Validators, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";
import {Program} from "../../../shared/types/program";
import {SidebarElement} from "../../../shared/interfaces/sidebar-element.interface";
import {ProgramService} from "../../../shared/services/program.service";
import {SideBarRightComponent} from "../../../ui-components/sidebar-right/sidebar-right.component";

@Component({
    selector: "app-program-manager",
    templateUrl: "./program-manager.component.html",
    styleUrls: ["./program-manager.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, SideBarRightComponent, ReactiveFormsModule],
})
export class ProgramManagerComponent implements OnInit, AfterViewInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    closeResult!: string;
    ngbModalRef?: NgbModalRef;
    subject!: Observable<SidebarElement[]>;
    nameFormControl: FormControl = new FormControl("");
    program: Program | undefined;
    selected: Subject<string> = new Subject();

    constructor(
        private modalService: NgbModal,
        private router: Router,
        private route: ActivatedRoute,
        private programService: ProgramService,
    ) {}

    ngOnInit(): void {
        this.subject = this.programService.programsSubject;
        this.nameFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
    }

    ngAfterViewInit() {
        this.route.url.subscribe((_segments) => {
            this.programService.getAllPrograms().subscribe((programs) => {
                this.selected.next(programs[0]?.getUUID());
            });
        });
    }

    getProgramFromRoute(): Program | undefined {
        const programNumber: string | undefined = this.router.url
            .split("/")
            .pop();
        if (!programNumber) return;
        return this.programService.getProgramFromCache(programNumber);
    }

    showModal(): Promise<string> {
        return this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        }).result;
    }

    addProgram() {
        this.nameFormControl.setValue("");
        this.showModal().then(() => {
            if (this.nameFormControl.valid) {
                this.programService
                    .createProgram(new Program(this.nameFormControl.value))
                    .subscribe((program) =>
                        this.selected.next(program.programNumber),
                    );
            }
        });
    }

    editProgram(uuid: string = "") {
        const program$ = this.programService.getProgramByProgramNumber(uuid);
        program$.subscribe((program) => {
            if (!program) return;

            this.nameFormControl.setValue(program.name);

            this.showModal().then(() => {
                if (this.nameFormControl.valid) {
                    program.name = this.nameFormControl.value;
                    this.programService.updateProgramByProgramNumber(program);
                }
            });
        });
    }

    deleteProgram(uuid: string = "") {
        this.programService.deleteProgramByProgramNumber(uuid).subscribe(() => {
            this.selected.next(this.programService.programs[0]?.getUUID());
        });
    }

    importProgram() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = () => {
            const file = input.files?.[0];

            if (!file) {
                return;
            }

            file.text().then((text) => {
                let importData: any;

                try {
                    importData = JSON.parse(text);
                } catch {
                    alert("Import failed: invalid JSON file.");
                    return;
                }

                if (
                    importData.type !== "pib-blockly-program" ||
                    typeof importData.codeVisual !== "string"
                ) {
                    alert("Import failed: invalid pib Blockly program file.");
                    return;
                }

                const importedName =
                    typeof importData.name === "string" &&
                    importData.name.trim().length >= 2
                        ? importData.name.trim()
                        : "Imported program";

                this.programService
                    .createProgram(new Program(importedName))
                    .subscribe((program) => {
                        this.programService
                            .updateCodeByProgramNumber(program.programNumber, {
                                codeVisual: importData.codeVisual,
                            })
                            .subscribe(() => {
                                this.selected.next(program.programNumber);
                            });
                    });
            });
        };

        input.click();
    }

    optionCallbackMethods = [
        {
            icon: "",
            label: "New program",
            clickCallback: this.addProgram.bind(this),
            disabled: false,
        },
        {
            icon: "",
            label: "Import program",
            clickCallback: this.importProgram.bind(this),
            disabled: false,
        },
    ];

    dropdownCallbackMethods = [
        {
            icon: "../../assets/edit.svg",
            label: "Rename",
            clickCallback: this.editProgram.bind(this),
            disabled: false,
        },
        {
            icon: "../../assets/delete.svg",
            label: "Delete",
            clickCallback: this.deleteProgram.bind(this),
            disabled: false,
        },
    ];
}
