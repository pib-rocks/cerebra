import {Component, OnInit} from "@angular/core";
import {SystemInfoService} from "src/app/shared/services/system-info.service";
import {
    DockerContainer,
    DockerContainerLogs,
} from "src/app/shared/types/system-info";

@Component({
    selector: "app-system-docker",
    templateUrl: "./system-docker.component.html",
    styleUrls: ["./system-docker.component.scss"],
})
export class SystemDockerComponent implements OnInit {
    containers: DockerContainer[] = [];
    selectedContainer: DockerContainer | null = null;
    logs = "";
    loading = false;
    loadingLogs = false;
    error: string | null = null;

    constructor(private systemInfoService: SystemInfoService) {}

    ngOnInit(): void {
        this.refresh();
    }

    refresh(): void {
        this.loading = true;
        this.error = null;
        this.systemInfoService.getContainers().subscribe({
            next: (containers) => {
                this.containers = containers;
                this.loading = false;
            },
            error: (err) => {
                this.error =
                    err?.error?.error || "Unable to load Docker containers.";
                this.loading = false;
            },
        });
    }

    selectContainer(container: DockerContainer): void {
        this.selectedContainer = container;
        this.loadingLogs = true;
        this.logs = "";
        this.systemInfoService.getContainerLogs(container.name).subscribe({
            next: (response: DockerContainerLogs) => {
                this.logs = response.logs || "(no logs)";
                this.loadingLogs = false;
            },
            error: (err) => {
                this.logs =
                    err?.error?.error || "Unable to load container logs.";
                this.loadingLogs = false;
            },
        });
    }

    closeLogs(): void {
        this.selectedContainer = null;
        this.logs = "";
    }

    isHealthy(container: DockerContainer): boolean {
        return container.health === "healthy";
    }
}
