import {
    OnInit,
    Component,
    ViewChild,
    TemplateRef,
    AfterViewInit,
} from "@angular/core";

import {Observable, Subject} from "rxjs";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {Program} from "../shared/types/program";
import {SidebarElement} from "../shared/interfaces/sidebar-element.interface";
import {ProgramService} from "../shared/services/program.service";

@Component({
    selector: "app-program",
    templateUrl: "./program.component.html",
    styleUrls: ["./program.component.scss"],
})
export class ProgramComponent implements OnInit, AfterViewInit {
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

    optionCallbackMethods = [
        {
            icon: "",
            label: "New program",
            clickCallback: this.addProgram.bind(this),
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
