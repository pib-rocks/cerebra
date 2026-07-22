import {Component, OnInit} from "@angular/core";
import {SystemInfoService} from "src/app/shared/services/system-info.service";
import {SystemInfo} from "src/app/shared/types/system-info";

@Component({
    selector: "app-system-host-info",
    templateUrl: "./system-host-info.component.html",
    styleUrls: ["./system-host-info.component.scss"],
})
export class SystemHostInfoComponent implements OnInit {
    info: SystemInfo | null = null;
    loading = false;
    error: string | null = null;

    constructor(private systemInfoService: SystemInfoService) {}

    ngOnInit(): void {
        this.refresh();
    }

    refresh(): void {
        this.loading = true;
        this.error = null;
        this.systemInfoService.getSystemInfo().subscribe({
            next: (info) => {
                this.info = info;
                this.loading = false;
            },
            error: (err) => {
                this.error =
                    err?.error?.error || "Unable to load system information.";
                this.loading = false;
            },
        });
    }

    formatUptime(seconds: number | null): string {
        if (seconds == null) {
            return "—";
        }
        const total = Math.floor(seconds);
        const days = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    memoryPercent(info: SystemInfo): number {
        if (!info.memory.totalMb) {
            return 0;
        }
        return Math.round((info.memory.usedMb / info.memory.totalMb) * 100);
    }
}
