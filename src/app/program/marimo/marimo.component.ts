import { Component, OnInit, ViewChild, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { Observable, Subject, filter, startWith } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MarimoNotebook, MarimoService } from "./marimo.service";
import { SidebarElement } from "../../shared/interfaces/sidebar-element.interface";
import { SideBarRightComponent } from "../../ui-components/sidebar-right/sidebar-right.component";

@Component({
    selector: "app-marimo",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SideBarRightComponent],
    templateUrl: "./marimo.component.html",
    styleUrls: ["./marimo.component.scss"],
})
export class MarimoComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    subject!: Observable<SidebarElement[]>;
    selected: Subject<string> = new Subject();
    readonly defaultFilename = "pib_sdk_demo.py";
    selectedFilename = this.defaultFilename;
    marimoUrl: SafeResourceUrl | null = null;
    nameFormControl = new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(255),
    ]);
    modalTitle = "WORKBOOK";
    targetUuid = "";

    constructor(
        private marimoService: MarimoService,
        private sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subject = this.marimoService.notebooksSubject;
        // The iframe must render even if the notebooks request is slow, empty or failing.
        this.setIframeUrl(this.defaultFilename);

        // The URL (:notebook child param) is the source of truth for the loaded notebook.
        // Re-read it on every navigation so clicking a notebook link updates the iframe,
        // even though this component instance is reused across /program/marimo/<file>.
        this.router.events
            .pipe(
                filter((e) => e instanceof NavigationEnd),
                startWith(null)
            )
            .subscribe(() => {
                const notebook = this.route.firstChild?.snapshot.paramMap.get("notebook");
                if (notebook) {
                    this.selectedFilename = notebook;
                    this.setIframeUrl(notebook);
                }
            });

        this.marimoService.getNotebooks().subscribe({
            next: (res: { notebooks?: MarimoNotebook[] } | null) => {
                const notebooks = res?.notebooks;
                const firstName =
                    notebooks && notebooks.length > 0 ? notebooks[0]?.name : undefined;
                if (firstName) {
                    this.selectNotebook(firstName);
                } else {
                    this.setIframeUrl(this.defaultFilename);
                }
            },
            error: () => {
                this.setIframeUrl(this.defaultFilename);
            },
        });
    }

    selectNotebook(filename: string): void {
        this.selectedFilename = filename;
        this.selected.next(filename);
        this.setIframeUrl(filename);
    }

    setIframeUrl(filename: string): void {
        const file = filename || this.defaultFilename;
        // Served through the Nginx reverse proxy so the iframe stays same-origin;
        // hitting the marimo port directly is blocked by the browser.
        const rawUrl = `/marimo-server/?file=${file}&theme=dark`;
        this.marimoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }

    showModal(): Promise<string> {
        return this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        }).result;
    }

    addWorkbook(): void {
        this.modalTitle = "NEW WORKBOOK";
        this.nameFormControl.setValue("");
        this.showModal().then(() => {
            if (this.nameFormControl.valid && this.nameFormControl.value) {
                const name = this.nameFormControl.value.trim();
                this.marimoService.createNotebook(name).subscribe(() => {
                    const filename = name.endsWith(".py") ? name : `${name}.py`;
                    this.selectNotebook(filename);
                });
            }
        });
    }

    renameWorkbook(uuid: string): void {
        this.modalTitle = "RENAME WORKBOOK";
        this.targetUuid = uuid;
        const currentName = uuid.replace(".py", "");
        this.nameFormControl.setValue(currentName);
        this.showModal().then(() => {
            if (this.nameFormControl.valid && this.nameFormControl.value) {
                const newName = this.nameFormControl.value.trim();
                this.marimoService.renameNotebook(uuid, newName).subscribe(() => {
                    const filename = newName.endsWith(".py") ? newName : `${newName}.py`;
                    this.selectNotebook(filename);
                });
            }
        });
    }

    deleteWorkbook(uuid: string): void {
        if (confirm(`Are you sure you want to delete workbook '${uuid}'?`)) {
            this.marimoService.deleteNotebook(uuid).subscribe(() => {
                if (this.selectedFilename === uuid) {
                    const remaining = this.marimoService.notebooks;
                    if (remaining.length > 0) {
                        this.selectNotebook(remaining[0].filename);
                    } else {
                        this.setIframeUrl(this.defaultFilename);
                    }
                }
            });
        }
    }

    optionCallbackMethods = [
        {
            icon: "",
            label: "New notebook",
            clickCallback: this.addWorkbook.bind(this),
            disabled: false,
        },
    ];

    dropdownCallbackMethods = [
        {
            icon: "../../assets/edit.svg",
            label: "Rename",
            clickCallback: this.renameWorkbook.bind(this),
            disabled: false,
        },
        {
            icon: "../../assets/delete.svg",
            label: "Delete",
            clickCallback: this.deleteWorkbook.bind(this),
            disabled: false,
        },
    ];
}
