import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    ElementRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {DockerService, DockerContainer} from "./docker.service";

@Component({
    selector: "app-docker-management",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./docker.component.html",
    styleUrls: ["./docker.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerManagementComponent implements OnInit, OnDestroy {
    @ViewChild("logContainer") logContainerElement?: ElementRef;

    containers: DockerContainer[] = [];
    loading = false;
    error: string | null = null;
    successMessage: string | null = null;

    actionLoading: {[containerName: string]: boolean} = {};
    purging = false;

    // Log Modal state
    showLogModal = false;
    activeContainerName: string | null = null;
    logsText = "";
    logsLoading = false;
    autoScroll = true;
    private logIntervalTimer: any = null;

    constructor(
        private dockerService: DockerService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.refreshContainers();
    }

    ngOnDestroy(): void {
        this.stopLogStreaming();
    }

    refreshContainers(): void {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        this.dockerService.getContainers().subscribe({
            next: (data) => {
                this.containers = data || [];
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.error = "Failed to load Docker containers.";
                this.loading = false;
                this.cdr.markForCheck();
            },
        });
    }

    startContainer(name: string): void {
        this.actionLoading[name] = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.dockerService.startContainer(name).subscribe({
            next: (res) => {
                this.actionLoading[name] = false;
                this.successMessage =
                    res.message || `Container ${name} started.`;
                this.refreshContainers();
            },
            error: (err) => {
                this.actionLoading[name] = false;
                this.error = `Failed to start container ${name}.`;
                this.cdr.markForCheck();
            },
        });
    }

    stopContainer(name: string): void {
        this.actionLoading[name] = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.dockerService.stopContainer(name).subscribe({
            next: (res) => {
                this.actionLoading[name] = false;
                this.successMessage =
                    res.message || `Container ${name} stopped.`;
                this.refreshContainers();
            },
            error: (err) => {
                this.actionLoading[name] = false;
                this.error = `Failed to stop container ${name}.`;
                this.cdr.markForCheck();
            },
        });
    }

    restartContainer(name: string): void {
        this.actionLoading[name] = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.dockerService.restartContainer(name).subscribe({
            next: (res) => {
                this.actionLoading[name] = false;
                this.successMessage =
                    res.message || `Container ${name} restarted.`;
                this.refreshContainers();
            },
            error: (err) => {
                this.actionLoading[name] = false;
                this.error = `Failed to restart container ${name}.`;
                this.cdr.markForCheck();
            },
        });
    }

    purgeDocker(): void {
        if (
            !confirm(
                "Are you sure you want to purge unused Docker resources (system prune)?",
            )
        ) {
            return;
        }

        this.purging = true;
        this.error = null;
        this.successMessage = null;
        this.cdr.markForCheck();

        this.dockerService.purgeDocker().subscribe({
            next: (res) => {
                this.purging = false;
                this.successMessage =
                    res.message || "Docker purge completed successfully.";
                this.refreshContainers();
            },
            error: (err) => {
                this.purging = false;
                this.error = "Failed to purge Docker system.";
                this.cdr.markForCheck();
            },
        });
    }

    // --- Log Streaming Modal ---

    openLogsModal(containerName: string): void {
        this.activeContainerName = containerName;
        this.showLogModal = true;
        this.logsText = "";
        this.logsLoading = true;
        this.autoScroll = true;
        this.cdr.markForCheck();

        this.fetchLogs();
        this.stopLogStreaming();
        this.logIntervalTimer = setInterval(() => {
            this.fetchLogs();
        }, 1000);
    }

    closeLogsModal(): void {
        this.stopLogStreaming();
        this.showLogModal = false;
        this.activeContainerName = null;
        this.logsText = "";
        this.cdr.markForCheck();
    }

    stopLogStreaming(): void {
        if (this.logIntervalTimer) {
            clearInterval(this.logIntervalTimer);
            this.logIntervalTimer = null;
        }
    }

    fetchLogs(): void {
        if (!this.activeContainerName) return;

        this.dockerService
            .getContainerLogs(this.activeContainerName)
            .subscribe({
                next: (res) => {
                    this.logsText = res.logs || "(No logs available)";
                    this.logsLoading = false;
                    this.cdr.markForCheck();

                    if (this.autoScroll) {
                        this.scrollToBottom();
                    }
                },
                error: () => {
                    this.logsLoading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    clearLogs(): void {
        if (!this.activeContainerName) return;

        this.dockerService
            .clearContainerLogs(this.activeContainerName)
            .subscribe({
                next: () => {
                    this.logsText = "";
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    console.error("Failed to clear logs", err);
                },
            });
    }

    toggleAutoScroll(): void {
        this.autoScroll = !this.autoScroll;
        if (this.autoScroll) {
            this.scrollToBottom();
        }
        this.cdr.markForCheck();
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            if (
                this.logContainerElement &&
                this.logContainerElement.nativeElement
            ) {
                const el = this.logContainerElement.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        }, 50);
    }

    getStatusBadgeClass(status: string | undefined): string {
        if (!status) return "badge-secondary";
        const st = status.toLowerCase();
        if (st === "running" || st === "healthy") return "badge-success";
        if (st === "exited" || st === "stopped" || st === "unhealthy")
            return "badge-danger";
        return "badge-warning";
    }
}
