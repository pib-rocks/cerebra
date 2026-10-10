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
import {
    AvailableUpdates,
    InstalledRevisions,
    PublishedRelease,
    ReleaseRecommendation,
    RepositoryAvailability,
    RepositoryRevision,
    UpdateChannel,
    UpdateRequest,
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
    readonly channels: UpdateChannel[] = ["release", "develop"];
    readonly phases = [
        "queued",
        "preflight",
        "fetching",
        "building",
        "restarting",
        "migrating",
        "verifying",
    ];
    readonly jobStorageKey = "pib.update.jobId";
    private readonly pollMs = 2000;
    private readonly checkTimeoutMs = 120000;
    private readonly maintenanceLimitMs = 90000;
    private readonly maxLogChars = 100000;
    private readonly maxLogFailures = 5;

    installed: InstalledRevisions | null = null;
    installedLoading = false;
    installedError: string | null = null;

    availability: AvailableUpdates | null = null;
    previousAvailability: AvailableUpdates | null = null;
    availabilityLoading = false;
    availabilityUnavailable: string | null = null;
    availabilityError: string | null = null;

    status: UpdateStatus | null = null;
    statusLoading = false;
    statusError: string | null = null;
    serviceUnavailable: string | null = null;
    maintenanceMessage: string | null = null;
    persistentConnectionFailure = false;

    channel: UpdateChannel | string = "release";
    chosenTag = "";
    force = false;
    acknowledgeException = false;
    confirmation = "";
    starting = false;
    cancelling = false;
    actionError: string | null = null;
    attachedJobId: string | null = null;

    log = "";
    logOffset = 0;
    logLoading = false;
    logError: string | null = null;

    private statusTimer: ReturnType<typeof setTimeout> | null = null;
    private checkTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;
    private logPollingStopped = false;
    private logFailures = 0;
    private pendingCheckId: string | null = null;
    private checkStartedAt = 0;
    private maintenanceSince: number | null = null;
    private maintenanceAttempts = 0;

    constructor(
        private updateService: UpdateService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.attachedJobId = sessionStorage.getItem(this.jobStorageKey);
        this.loadInstalledRevisions();
        this.loadAvailableUpdates();
        this.refreshStatus();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.stopStatusPolling();
        this.stopCheckPolling();
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

    get deviceChannel(): string {
        if (this.availability?.deviceChannel) {
            return this.availability.deviceChannel;
        }
        const channels = this.installedRepositories
            .map((repository) => repository.channel)
            .filter(
                (channel): channel is string =>
                    !!channel && channel !== "unknown",
            );
        if (channels.length === 0) {
            return "unknown";
        }
        return channels.every((channel) => channel === channels[0])
            ? channels[0]
            : "mixed";
    }

    get recommendation(): ReleaseRecommendation | null {
        return this.availability?.recommendation ?? null;
    }

    get selectedRelease(): PublishedRelease | ReleaseRecommendation | null {
        if (this.chosenTag) {
            return (
                this.availability?.releases?.find(
                    (release) => release.tag === this.chosenTag,
                ) ?? null
            );
        }
        return this.recommendation;
    }

    get ordinaryUpdate(): boolean {
        const release = this.selectedRelease;
        if (!release) {
            return false;
        }
        if ("ordinaryUpdate" in release) {
            return release.ordinaryUpdate === true;
        }
        return release.relation === "newer" && release.installable === true;
    }

    get canStart(): boolean {
        return this.installBlocker === null;
    }

    get installBlocker(): string | null {
        if (this.starting || this.isActive) {
            return "An update is already in progress.";
        }
        if (this.statusLoading && !this.status) {
            return "Update status is still unknown.";
        }
        if (!this.status) {
            return "Update status is unknown.";
        }
        if (this.serviceUnavailable) {
            return this.serviceUnavailable;
        }
        if (this.readinessMessage) {
            return this.readinessMessage;
        }
        if (!this.status.readiness) {
            return "Updater readiness has not been reported.";
        }
        if (this.confirmation !== this.confirmationToken) {
            return "Type UPDATE to confirm.";
        }
        if (this.channel === "release") {
            const release = this.selectedRelease;
            if (!release || release.installable === false) {
                return "No installable published release is selected.";
            }
            if (release.relation === "current") {
                return "That published release is already installed.";
            }
            if (!this.ordinaryUpdate && !this.acknowledgeException) {
                return "This is not an ordinary newer-release install. Confirm it under Details / Expert.";
            }
            return null;
        }
        if (this.channel === "develop") {
            if (!this.developPinned) {
                return "The development check has not pinned both repository commits.";
            }
            if (!this.acknowledgeException) {
                return "Development installs must be confirmed as an expert action.";
            }
            return null;
        }
        return "Channel must be release or develop.";
    }

    get developPinned(): boolean {
        const repositories = this.availability?.repositories ?? {};
        return ["pib-backend", "cerebra"].every((name) => {
            const target = repositories[name]?.target;
            return typeof target === "string" && /^[0-9a-f]{40}$/.test(target);
        });
    }

    get readinessMessage(): string | null {
        const readiness = this.status?.readiness;
        if (!readiness || readiness.ready) {
            return null;
        }
        const blocked = readiness.checks.filter(
            (check) => check.status === "missing" || check.status === "failed",
        );
        if (blocked.length === 0) {
            return "Updater readiness is not confirmed.";
        }
        return blocked
            .map((check) =>
                [check.detail, check.repair].filter(Boolean).join(" "),
            )
            .join(" ");
    }

    get isActive(): boolean {
        return this.isActiveStatus(this.status);
    }

    get isTerminal(): boolean {
        return this.isTerminalStatus(this.status);
    }

    get isStale(): boolean {
        return this.status?.classification === "stale";
    }

    get logExcerpt(): string {
        const excerptLength = 4000;
        return this.log.length > excerptLength
            ? this.log.slice(-excerptLength)
            : this.log;
    }

    get pendingCheckLabel(): string {
        return this.pendingCheckId || "unknown";
    }

    get releaseNotes(): string {
        const notes = this.selectedRelease?.notes;
        return notes && notes.trim().length > 0
            ? notes
            : "No release notes were reported.";
    }

    relationText(relation: string | undefined): string {
        switch (relation) {
            case "newer":
                return "Newer published release";
            case "current":
                return "Already installed";
            case "older":
                return "Older than the installed release";
            case "channel-change":
                return "Leaves the development build for a stable release";
            case "drift":
                return "Version text matches, but the installed commits differ";
            default:
                return "Relation to the installed version is unknown";
        }
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
                if (!availability.checkedAt && !this.isActive) {
                    this.checkForUpdates();
                }
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.handleAvailabilityError(error);
            },
        });
    }

    checkForUpdates(): void {
        if (this.channel !== "release" && this.channel !== "develop") {
            this.availabilityError = "Channel must be release or develop.";
            this.cdr.markForCheck();
            return;
        }
        this.availabilityLoading = true;
        this.availabilityUnavailable = null;
        this.availabilityError = null;
        this.stopCheckPolling();
        this.cdr.markForCheck();

        this.updateService.checkForUpdates(this.channel).subscribe({
            next: (check) => {
                this.pendingCheckId = check.checkId;
                this.checkStartedAt = Date.now();
                this.pollAvailability();
            },
            error: (error: HttpErrorResponse) => {
                this.pendingCheckId = null;
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
        if (!this.attachedJobId && !this.isActive) {
            this.serviceUnavailable = null;
        }
        this.cdr.markForCheck();

        this.updateService.getStatus().subscribe({
            next: (status) => {
                this.statusLoading = false;
                this.maintenanceSince = null;
                this.maintenanceAttempts = 0;
                this.maintenanceMessage = null;
                this.persistentConnectionFailure = false;
                this.applyStatus(status);
            },
            error: (error: HttpErrorResponse) => {
                this.statusLoading = false;
                if (this.attachedJobId || this.isActive) {
                    this.enterMaintenance(error);
                    return;
                }
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
        if (this.channel !== "release" && this.channel !== "develop") {
            return;
        }

        this.starting = true;
        this.actionError = null;
        this.serviceUnavailable = null;
        this.cdr.markForCheck();

        const request: UpdateRequest = {
            channel: this.channel,
            force: this.force,
            confirmation: "UPDATE",
        };
        if (this.channel === "release" && this.selectedRelease) {
            request.release = this.selectedRelease.tag;
            if (this.availability?.checkId) {
                request.checkId = this.availability.checkId;
            }
        }
        if (this.channel === "develop") {
            request.pin = true;
            if (this.availability?.checkId) {
                request.checkId = this.availability.checkId;
            }
        }

        this.updateService.startUpdate(request).subscribe({
            next: (response) => {
                this.starting = false;
                this.resetLog();
                const status = response?.status;
                const job = response?.job;
                if (request.release && job && !job.targets) {
                    this.actionError =
                        "The API queued a channel-only update and did not record pinned commits. Cancel it and deploy the backend release-pair update before installing.";
                }
                if (status?.state) {
                    this.applyStatus(status);
                    return;
                }
                this.actionError =
                    this.actionError ??
                    "The update response did not include a status document.";
                if (job?.jobId) {
                    this.rememberJob(job.jobId);
                    this.refreshStatus();
                }
                this.cdr.markForCheck();
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
                        "The cancellation request failed. This is not a rollback.",
                    );
                    this.adoptConflictStatus(error);
                } else if (error.status === 503) {
                    this.serviceUnavailable = this.serviceRepairHint(error);
                } else {
                    this.actionError = this.httpErrorMessage(
                        error,
                        "The cancellation request failed. This is not a rollback.",
                    );
                }
                this.cdr.markForCheck();
            },
        });
    }

    retryLog(): void {
        this.logPollingStopped = false;
        this.logFailures = 0;
        this.logError = null;
        this.fetchLog();
        this.cdr.markForCheck();
    }

    reloadFrontend(): void {
        window.location.reload();
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
        if (this.isActiveStatus(status) && status.jobId) {
            this.rememberJob(status.jobId);
        } else if (
            this.isTerminalStatus(status) ||
            status.state === "idle" ||
            status.classification === "idle" ||
            status.classification === "stale"
        ) {
            this.clearRememberedJob();
        }

        if (this.isActiveStatus(status)) {
            this.logPollingStopped = false;
            this.fetchLog();
            this.scheduleStatusPoll(this.pollMs);
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

    private scheduleStatusPoll(delay: number): void {
        this.stopStatusPolling();
        if (this.destroyed) {
            return;
        }
        this.statusTimer = setTimeout(() => {
            this.statusTimer = null;
            this.cdr.markForCheck();
            this.pollStatus();
        }, delay);
    }

    private pollStatus(): void {
        this.updateService.getStatus().subscribe({
            next: (status) => {
                this.maintenanceSince = null;
                this.maintenanceAttempts = 0;
                this.maintenanceMessage = null;
                this.persistentConnectionFailure = false;
                this.logFailures = 0;
                this.logPollingStopped = false;
                this.applyStatus(status);
            },
            error: (error: HttpErrorResponse) => {
                this.enterMaintenance(error);
            },
        });
    }

    private enterMaintenance(error: HttpErrorResponse): void {
        if (this.maintenanceSince === null) {
            this.maintenanceSince = Date.now();
        }
        const elapsed = Date.now() - this.maintenanceSince;
        if (elapsed >= this.maintenanceLimitMs) {
            this.persistentConnectionFailure = true;
            this.maintenanceMessage = null;
            this.statusError =
                "The update service stayed unreachable after the maintenance window. This is a connection failure, not a finished update result.";
            this.stopStatusPolling();
            this.cdr.markForCheck();
            return;
        }
        this.maintenanceMessage =
            "Reconnecting. The stack is being replaced and the update service is temporarily unavailable.";
        this.statusError = null;
        if (error.status === 503 && !this.isActive && !this.attachedJobId) {
            this.serviceUnavailable = this.serviceRepairHint(error);
        }
        const delay = Math.min(
            15000,
            this.pollMs * 2 ** this.maintenanceAttempts,
        );
        this.maintenanceAttempts += 1;
        this.scheduleStatusPoll(delay);
        this.cdr.markForCheck();
    }

    private pollAvailability(): void {
        this.updateService.getAvailableUpdates().subscribe({
            next: (document) => this.considerAvailability(document),
            error: (error: HttpErrorResponse) => {
                if (!this.pendingCheckId) {
                    this.handleAvailabilityError(error);
                    return;
                }
                if (this.checkTimedOut()) {
                    return;
                }
                this.scheduleCheckPoll();
            },
        });
    }

    private considerAvailability(document: AvailableUpdates): void {
        if (!this.pendingCheckId) {
            this.availability = document;
            this.availabilityLoading = false;
            this.cdr.markForCheck();
            return;
        }
        const pendingMatch =
            document.state === "pending" &&
            document.checkId === this.pendingCheckId;
        const completedMatch =
            document.checkId === this.pendingCheckId &&
            document.state !== "pending";
        if (pendingMatch) {
            this.previousAvailability =
                document.previous ?? this.previousAvailability;
            if (!this.checkTimedOut()) {
                this.scheduleCheckPoll();
            }
            return;
        }
        if (completedMatch) {
            this.pendingCheckId = null;
            this.stopCheckPolling();
            if (document.state === "failed" || document.error) {
                this.availabilityLoading = false;
                this.availabilityError =
                    document.error ||
                    "The availability check failed. The previous result was kept.";
                this.cdr.markForCheck();
                return;
            }
            this.availability = document;
            this.availabilityLoading = false;
            this.availabilityError = null;
            this.cdr.markForCheck();
            return;
        }
        this.previousAvailability = document;
        if (!this.checkTimedOut()) {
            this.scheduleCheckPoll();
        }
    }

    private checkTimedOut(): boolean {
        if (Date.now() - this.checkStartedAt < this.checkTimeoutMs) {
            return false;
        }
        this.pendingCheckId = null;
        this.stopCheckPolling();
        this.availabilityLoading = false;
        this.availabilityError =
            "The availability check timed out. The previous result was kept and is not the result of this check.";
        this.cdr.markForCheck();
        return true;
    }

    private scheduleCheckPoll(): void {
        this.stopCheckPolling();
        if (this.destroyed) {
            return;
        }
        this.checkTimer = setTimeout(() => {
            this.checkTimer = null;
            this.pollAvailability();
        }, this.pollMs);
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
                this.log = (this.log + (response.content ?? "")).slice(
                    -this.maxLogChars,
                );
                this.logOffset = response.nextOffset;
                this.logLoading = false;
                this.logFailures = 0;
                this.logError = null;
                this.cdr.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.logLoading = false;
                this.logFailures += 1;
                this.logError = this.httpErrorMessage(
                    error,
                    "The update log could not be loaded.",
                );
                if (this.logFailures >= this.maxLogFailures) {
                    this.logPollingStopped = true;
                    this.logError +=
                        " Automatic log polling has stopped after repeated failures.";
                }
                this.cdr.markForCheck();
            },
        });
    }

    private resetLog(): void {
        this.log = "";
        this.logOffset = 0;
        this.logError = null;
        this.logFailures = 0;
        this.logPollingStopped = false;
    }

    private stopStatusPolling(): void {
        if (this.statusTimer !== null) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }
    }

    private stopCheckPolling(): void {
        if (this.checkTimer !== null) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
    }

    private rememberJob(jobId: string): void {
        this.attachedJobId = jobId;
        sessionStorage.setItem(this.jobStorageKey, jobId);
    }

    private clearRememberedJob(): void {
        this.attachedJobId = null;
        sessionStorage.removeItem(this.jobStorageKey);
    }

    private isActiveStatus(status: UpdateStatus | null): boolean {
        if (!status || status.classification === "stale") {
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
        return `Update service needs repair: ${detail}. Re-run the update section of setup/installation_scripts/docker_install.sh on the host. The page cannot install missing units by queueing an update.`;
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
