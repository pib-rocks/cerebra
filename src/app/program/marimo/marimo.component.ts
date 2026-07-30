import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MarimoService, MarimoNotebook } from "./marimo.service";

@Component({
    selector: "app-marimo",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./marimo.component.html",
    styleUrls: ["./marimo.component.scss"],
})
export class MarimoComponent implements OnInit {
    notebooks: MarimoNotebook[] = [];
    selectedNotebook: MarimoNotebook | null = null;
    marimoUrl: SafeResourceUrl | null = null;
    newNotebookName = "";

    constructor(
        private marimoService: MarimoService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadNotebooks();
        this.setIframeUrl("pib_sdk_demo.py");
    }

    loadNotebooks(): void {
        this.marimoService.getNotebooks().subscribe({
            next: (res) => {
                if (res && res.notebooks) {
                    this.notebooks = res.notebooks;
                    if (!this.selectedNotebook && this.notebooks.length > 0) {
                        this.selectNotebook(this.notebooks[0]);
                    }
                }
            },
            error: (err) => console.error("Error loading Marimo notebooks:", err),
        });
    }

    selectNotebook(nb: MarimoNotebook): void {
        this.selectedNotebook = nb;
        this.setIframeUrl(nb.name);
    }

    setIframeUrl(filename: string): void {
        const host = window.location.hostname || "192.168.1.28";
        const rawUrl = `http://${host}:2718/@file/${filename}`;
        this.marimoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }

    createNewNotebook(): void {
        if (!this.newNotebookName.trim()) return;
        const name = this.newNotebookName.trim();
        this.marimoService.createNotebook(name).subscribe({
            next: () => {
                this.newNotebookName = "";
                this.loadNotebooks();
            },
            error: (err) => console.error("Error creating notebook:", err),
        });
    }

    deleteNotebook(nb: MarimoNotebook, event: Event): void {
        event.stopPropagation();
        if (confirm(`Are you sure you want to delete notebook '${nb.name}'?`)) {
            this.marimoService.deleteNotebook(nb.name).subscribe({
                next: () => {
                    if (this.selectedNotebook?.name === nb.name) {
                        this.selectedNotebook = null;
                    }
                    this.loadNotebooks();
                },
                error: (err) => console.error("Error deleting notebook:", err),
            });
        }
    }
}
