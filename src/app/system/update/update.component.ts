import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {switchMap} from "rxjs";
import {
    AvailableUpdates,
    InstalledRevisions,
    RepositoryAvailability,
    RepositoryRevision,
    UpdateService,
    UpdateStatus,
} from "./update.service";

interface NamedRevision extends RepositoryRevision {
    name: string;
}

interface NamedAvailability extends RepositoryAvailability {
    name: string;
}

@Component({
    selector: "app-update",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./update.component.html",
    styleUrls: ["./update.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateComponent implements OnInit, OnDestroy {
    readonly confirmationToken = "UPDATE";
    readonly phases = [
        "queued",
        "preflight",
        "fetching",
        "building",
        "restarting",
        "migrating",
        "verifying",
    ];

    installed: InstalledRevisions | null = null;
    installedLoading = false;
    installedError: string | null = null;

    availability: AvailableUpdates | null = null;
    availabilityLoading = false;
    availabilityUnavailable: string | null = null;
    availabilityError: string | null = null;

    status: UpdateStatus | null = null;
    statusLoading = false;
    statusError: string | null = null;
    serviceUnavailable: string | null = null;

    channel = "";
    force = false;
    confirmation = "";
    starting = false;
    cancelling = false;
    actionError: string | null = null;

    log = "";
    logOffset = 0;
    logLoading = false;
    logError: string | null = null;

    private statusTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;
    private logPollingStopped = false;

    constructor(
        private updateService: UpdateService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.loadInstalledRevisions();
        this.loadAvailableUpdates();
        this.refreshStatus();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.stopStatusPolling();
    }

    get installedRepositories(): NamedRevision[] {
        return Object.entries(this.installed?.repositories ?? {}).map(
            ([name, revision]) => ({name, ...revision}),
        );
    }

    get availableRepositories(): NamedAvailability[] {
        return Object.entries(this.availability?.repositories ?? {}).map(
            ([name, availability]) => ({name, ...availability}),
        );
    }

    get canStart(): boolean {
        return (
            !this.starting &&
            !this.isActive &&
            this.channel.trim().length > 0 &&
            this.confirmation === this.confirmationToken
        );
    }

    get isActive(): boolean {
        return this.isActiveStatus(this.status);
    }

    get isTerminal(): boolean {
        return this.isTerminalStatus(this.status);
    }

    get logExcerpt(): string {
        const excerptLength = 4000;
        return this.log.length > excerptLength
            ? this.log.slice(-excerptLength)
            : this.log;
    }

    loadInstalledRevisions(): void {
        this.installedLoading = true;
        this.installedError = null;
        this.cdr.markForCheck();

        this.updateService.getInstalledRevisions().subscribe({
            next: (installed) => {
                this.installed = installed;
                this.installedLoading = false;
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.installedError = this.httpErrorMessage(
                    error,
                    "Installed revisions could not be loaded.",
                );
                this.installedLoading = false;
                this.cdr.markForCheck();
            },
        });
    }

    loadAvailableUpdates(): void {
        this.availabilityLoading = true;
        this.availabilityUnavailable = null;
        this.availabilityError = null;
        this.cdr.markForCheck();

        this.updateService.getAvailableUpdates().subscribe({
            next: (availability) => {
                this.availability = availability;
                this.availabilityLoading = false;
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.handleAvailabilityError(error);
            },
        });
    }

    checkForUpdates(): void {
        this.availabilityLoading = true;
        this.availabilityUnavailable = null;
        this.availabilityError = null;
        this.cdr.markForCheck();

        this.updateService
            .checkForUpdates()
            .pipe(switchMap(() => this.updateService.getAvailableUpdates()))
            .subscribe({
                next: (availability) => {
                    this.availability = availability;
                    this.availabilityLoading = false;
                    this.cdr.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 409) {
                        this.availabilityLoading = false;
                        this.availabilityError = this.httpErrorMessage(
                            error,
                            "Availability cannot be checked while an update is running.",
                        );
                        this.adoptConflictStatus(error);
                        this.cdr.markForCheck();
                        return;
                    }
                    this.handleAvailabilityError(error);
                },
            });
    }

    refreshStatus(): void {
        this.stopStatusPolling();
        this.statusLoading = true;
        this.statusError = null;
        this.serviceUnavailable = null;
        this.cdr.markForCheck();

        this.updateService.getStatus().subscribe({
            next: (status) => {
                this.statusLoading = false;
                this.applyStatus(status);
            },
            error: (error: HttpErrorResponse) => {
                this.statusLoading = false;
                if (error.status === 503) {
                    this.serviceUnavailable = this.serviceRepairHint(error);
                } else {
                    this.statusError = this.httpErrorMessage(
                        error,
                        "Update status could not be loaded. Polling has stopped.",
                    );
                }
                this.cdr.markForCheck();
            },
        });
    }

    startUpdate(): void {
        if (!this.canStart) {
            return;
        }

        this.starting = true;
        this.actionError = null;
        this.serviceUnavailable = null;
        this.cdr.markForCheck();

        this.updateService
            .startUpdate({
                channel: this.channel.trim(),
                force: this.force,
                confirmation: "UPDATE",
            })
            .subscribe({
                next: (response) => {
                    this.starting = false;
                    this.resetLog();
                    this.applyStatus(response.job);
                },
                error: (error: HttpErrorResponse) => {
                    this.starting = false;
                    if (error.status === 409) {
                        this.actionError = this.httpErrorMessage(
                            error,
                            "An update is already queued or running.",
                        );
                        this.adoptConflictStatus(error);
                    } else if (error.status === 503) {
                        this.serviceUnavailable = this.serviceRepairHint(error);
                    } else {
                        this.actionError = this.httpErrorMessage(
                            error,
                            "The update could not be started.",
                        );
                    }
                    this.cdr.markForCheck();
                },
            });
    }

    cancelUpdate(): void {
        if (!this.isActive || this.cancelling) {
            return;
        }

        this.cancelling = true;
        this.actionError = null;
        this.cdr.markForCheck();

        this.updateService.cancelUpdate().subscribe({
            next: (response) => {
                this.cancelling = false;
                if (
                    response.status &&
                    typeof response.status === "object" &&
                    "state" in response.status
                ) {
                    this.applyStatus(response.status);
                } else {
                    this.refreshStatus();
                }
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.cancelling = false;
                if (error.status === 409) {
                    this.actionError = this.httpErrorMessage(
                        error,
                        "The update can no longer be cancelled.",
                    );
                    this.adoptConflictStatus(error);
                } else if (error.status === 503) {
                    this.serviceUnavailable = this.serviceRepairHint(error);
                } else {
                    this.actionError = this.httpErrorMessage(
                        error,
                        "The cancellation request failed.",
                    );
                }
                this.cdr.markForCheck();
            },
        });
    }

    retryLog(): void {
        this.logPollingStopped = false;
        this.logError = null;
        this.fetchLog();
        this.cdr.markForCheck();
    }

    shortRevision(revision: string | undefined): string {
        return revision ? revision.slice(0, 12) : "unknown";
    }

    availabilityText(repository: RepositoryAvailability): string {
        if (repository.error) {
            return repository.error;
        }
        if (repository.updateAvailable === true) {
            return repository.target
                ? `Update available: ${this.shortRevision(repository.target)}`
                : "Update available; target revision was not provided.";
        }
        if (repository.updateAvailable === false) {
            return "Up to date";
        }
        return "Update availability is unknown.";
    }

    availabilityClass(repository: RepositoryAvailability): string {
        if (repository.error || repository.updateAvailable === "unknown") {
            return "text-warning";
        }
        return repository.updateAvailable ? "text-info" : "text-success";
    }

    phaseClass(phase: string): string {
        if (!this.status) {
            return "phase-pending";
        }
        if (this.status.state === "done") {
            return "phase-complete";
        }

        const currentIndex = this.phases.indexOf(this.status.state);
        const phaseIndex = this.phases.indexOf(phase);
        if (phaseIndex < currentIndex) {
            return "phase-complete";
        }
        if (phaseIndex === currentIndex) {
            return this.isTerminal ? "phase-failed" : "phase-active";
        }
        return "phase-pending";
    }

    private applyStatus(status: UpdateStatus): void {
        const previousJobId = this.status?.jobId;
        const previousState = this.status?.state;
        if (status.jobId && previousJobId && status.jobId !== previousJobId) {
            this.resetLog();
        }

        this.status = status;
        this.serviceUnavailable = null;
        this.statusError = null;

        if (this.isActiveStatus(status)) {
            this.fetchLog();
            this.scheduleStatusPoll();
        } else {
            this.stopStatusPolling();
            if (this.isTerminalStatus(status)) {
                this.fetchLog();
            }
            if (status.state === "done" && previousState !== "done") {
                this.loadInstalledRevisions();
            }
        }
        this.cdr.markForCheck();
    }

    private scheduleStatusPoll(): void {
        this.stopStatusPolling();
        if (this.destroyed) {
            return;
        }
        this.statusTimer = setTimeout(() => {
            this.statusTimer = null;
            this.cdr.markForCheck();
            this.pollStatus();
        }, 2000);
    }

    private pollStatus(): void {
        this.updateService.getStatus().subscribe({
            next: (status) => {
                this.applyStatus(status);
            },
            error: (error: HttpErrorResponse) => {
                this.statusError = this.httpErrorMessage(
                    error,
                    "Live status was interrupted. Polling has stopped; refresh status to continue.",
                );
                if (error.status === 503) {
                    this.serviceUnavailable = this.serviceRepairHint(error);
                }
                this.stopStatusPolling();
                this.cdr.markForCheck();
            },
        });
    }

    private fetchLog(): void {
        if (
            this.logLoading ||
            this.logPollingStopped ||
            (!this.isActive && !this.isTerminal)
        ) {
            return;
        }

        this.logLoading = true;
        this.cdr.markForCheck();
        this.updateService.getLog(this.logOffset).subscribe({
            next: (response) => {
                this.log += response.content ?? "";
                this.logOffset = response.nextOffset;
                this.logLoading = false;
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.logLoading = false;
                this.logPollingStopped = true;
                this.logError = this.httpErrorMessage(
                    error,
                    "The update log could not be loaded. Automatic log polling has stopped.",
                );
                this.cdr.markForCheck();
            },
        });
    }

    private resetLog(): void {
        this.log = "";
        this.logOffset = 0;
        this.logError = null;
        this.logPollingStopped = false;
    }

    private stopStatusPolling(): void {
        if (this.statusTimer !== null) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }
    }

    private isActiveStatus(status: UpdateStatus | null): boolean {
        if (!status) {
            return false;
        }
        return (
            status.classification === "running" ||
            status.classification === "queued" ||
            this.phases.includes(status.state)
        );
    }

    private isTerminalStatus(status: UpdateStatus | null): boolean {
        return (
            status !== null &&
            ["done", "failed", "rolled_back", "cancelled"].includes(
                status.state,
            )
        );
    }

    private handleAvailabilityError(error: HttpErrorResponse): void {
        this.availabilityLoading = false;
        if (error.status === 404 || error.status === 503) {
            this.availabilityUnavailable =
                "Update availability: not available yet (backend story PR-1813).";
        } else {
            this.availabilityError = this.httpErrorMessage(
                error,
                "Update availability could not be loaded.",
            );
        }
        this.cdr.markForCheck();
    }

    private adoptConflictStatus(error: HttpErrorResponse): void {
        const conflictStatus = error.error?.status;
        if (
            conflictStatus &&
            typeof conflictStatus === "object" &&
            "state" in conflictStatus
        ) {
            this.applyStatus(conflictStatus as UpdateStatus);
        }
    }

    private serviceRepairHint(error: HttpErrorResponse): string {
        const state = error.error?.state;
        const detail =
            state === "runner_missing"
                ? "the update runner is missing"
                : state === "not_installed"
                ? "the update service is not installed"
                : "the update service is unavailable";
        return `Update service needs repair: ${detail}. Check the robot installation before trying again.`;
    }

    private httpErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const backendMessage = error.error?.error ?? error.error?.message;
        return typeof backendMessage === "string" && backendMessage.length > 0
            ? backendMessage
            : fallback;
    }
}
