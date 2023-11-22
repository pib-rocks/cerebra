import {OnInit, Component, ViewChild, TemplateRef} from "@angular/core";

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
    styleUrls: ["./program.component.css"],
})
export class ProgramComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    closeResult!: string;
    ngbModalRef?: NgbModalRef;
    subject!: Observable<SidebarElement[]>;
    programIcon: string = "";
    nameFormControl: FormControl = new FormControl("");

    route!: ActivatedRoute;

    selected: Subject<string> = new Subject();

    constructor(
        private modalService: NgbModal,
        private router: Router,
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
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        }).result;
    }

    addProgram = () => {
        this.nameFormControl.setValue("");
        this.showModal()
            .then(() => {
                if (this.nameFormControl.valid) {
                    this.programService
                        .createProgram(new Program(this.nameFormControl.value))
                        .subscribe((program) =>
                            this.selected.next(program.programNumber),
                        );
                }
            })
            .catch(() => undefined);
    };

    editProgram = () => {
        const program = this.getProgramFromRoute()?.clone();
        if (!program) return;
        this.nameFormControl.setValue(program.name);
        this.showModal()
            .then(() => {
                if (this.nameFormControl.valid) {
                    program.name = this.nameFormControl.value;
                    this.programService
                        .updateProgramByProgramNumber(program)
                        .subscribe((program) =>
                            this.selected.next(program.programNumber),
                        );
                }
            })
            .catch(() => undefined);
    };

    deleteProgram = () => {
        const program = this.getProgramFromRoute();
        if (!program) return;
        this.programService.deleteProgramByProgramNumber(program.programNumber);
    };

    headerElements = [
        {
            icon: "../../assets/program/program-add.svg",
            label: "ADD",
            clickCallback: this.addProgram,
        },
        {
            icon: "../../assets/program/program-delete.svg",
            label: "DELETE",
            clickCallback: this.deleteProgram,
        },
        {
            icon: "../../assets/program/program-edit.svg",
            label: "EDIT",
            clickCallback: this.editProgram,
        },
    ];
}
