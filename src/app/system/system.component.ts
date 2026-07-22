import {Component} from "@angular/core";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SystemInfoService} from "../shared/services/system-info.service";

@Component({
    selector: "app-system",
    templateUrl: "./system.component.html",
    styleUrls: ["./system.component.scss"],
})
export class SystemComponent {
    downloadingDiagnostics = false;

    constructor(
        private systemInfoService: SystemInfoService,
        private matSnackBar: MatSnackBar,
    ) {}

    downloadDiagnostics(): void {
        if (this.downloadingDiagnostics) {
            return;
        }
        this.downloadingDiagnostics = true;
        this.systemInfoService.downloadDiagnostics().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `pib-diagnostics-${new Date()
                    .toISOString()
                    .replace(/[:.]/g, "-")}.zip`;
                anchor.click();
                window.URL.revokeObjectURL(url);
                this.downloadingDiagnostics = false;
                this.matSnackBar.open(
                    "Diagnostics archive downloaded.",
                    "",
                    {panelClass: "cerebra-toast", duration: 3000},
                );
            },
            error: () => {
                this.downloadingDiagnostics = false;
                this.matSnackBar.open(
                    "Unable to generate diagnostics archive.",
                    "",
                    {panelClass: "cerebra-toast", duration: 3000},
                );
            },
        });
    }
}
