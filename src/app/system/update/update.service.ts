import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export type UpdateAvailability = boolean | "unknown";
export type UpdateChannel = "release" | "develop";

export interface RepositoryRevision {
    gitSha: string;
    repository?: string;
    channel?: string;
    buildTime?: string;
}

export interface InstalledRevisions {
    imageVersion?: string;
    repositories: Record<string, RepositoryRevision>;
}

export interface RepositoryAvailability {
    installed: string;
    target?: string;
    branchTarget?: string;
    updateAvailable: UpdateAvailability;
    error?: string;
}

export interface ReleaseCommit {
    commit: string;
    tag?: string;
}

export interface PublishedRelease {
    tag: string;
    installable: boolean;
    notes?: string;
    relation?: string;
    publishedAt?: string | null;
    targets?: Record<string, ReleaseCommit>;
}

export interface ReleaseRecommendation {
    tag: string;
    relation: string;
    installable: boolean;
    ordinaryUpdate: boolean;
    notes?: string;
    targets?: Record<string, ReleaseCommit>;
}

export interface IncompleteRelease {
    tag: string;
    reason: string;
    installable?: boolean;
    missing?: string[];
}

export interface AvailableUpdates {
    schemaVersion?: number;
    state?: string;
    checkId?: string;
    channel?: string;
    requestedAt?: string;
    checkedAt?: string | null;
    repositories: Record<string, RepositoryAvailability>;
    releases?: PublishedRelease[];
    incomplete?: IncompleteRelease[];
    excluded?: Array<{tag: string; reason: string}>;
    latestInstallable?: string | null;
    recommendation?: ReleaseRecommendation | null;
    installedVersion?: string;
    deviceChannel?: string;
    previous?: AvailableUpdates | null;
    error?: string;
}

export interface UpdateCheckJob {
    schemaVersion: number;
    checkId: string;
    channel: string;
    requestedAt: string;
    actor: string;
}

export interface ReadinessCheck {
    name: string;
    status: string;
    detail: string;
    repair?: string;
}

export interface UpdateReadiness {
    ready: boolean;
    checks: ReadinessCheck[];
    serviceMarkerIsNotLiveness?: boolean;
}

export interface InterruptedJob {
    jobId?: string;
    state?: string;
    classification?: string;
    staleReason?: string;
    channel?: string;
}

export interface UpdateStatus {
    state: string;
    classification?: string;
    message?: string;
    error?: string;
    jobId?: string;
    channel?: string;
    force?: boolean;
    release?: string;
    targetKind?: string;
    targets?: Record<string, string>;
    attempt?: number;
    maxAttempts?: number;
    predecessorInterrupted?: boolean;
    cancelRequested?: boolean;
    cancelSafe?: boolean;
    requestPending?: boolean;
    blocksNewUpdate?: boolean;
    staleReason?: string;
    recovery?: string;
    readiness?: UpdateReadiness;
    interruptedJob?: InterruptedJob;
    unhealthyServices?: string[];
    createdAt?: string;
    queuedAt?: string;
    startedAt?: string;
    updatedAt?: string;
    completedAt?: string;
    finishedAt?: string;
}

/** Accepted request. It has no runner state; that is `UpdateJobResponse.status`. */
export interface UpdateRequestJob {
    schemaVersion?: number;
    jobId: string;
    requestedAt?: string;
    actor?: string;
    channel: string;
    force: boolean;
    confirmation: "UPDATE";
    release?: string;
    targets?: Record<string, string>;
    targetKind?: string;
    checkId?: string;
}

export interface UpdateJobResponse {
    job: UpdateRequestJob;
    status: UpdateStatus;
    programRunningSignal?: string;
}

export interface UpdateLogResponse {
    offset: number;
    nextOffset: number;
    content: string;
}

export interface UpdateRequest {
    channel: UpdateChannel;
    force: boolean;
    confirmation: "UPDATE";
    release?: string;
    pin?: boolean;
    checkId?: string;
}

@Injectable({
    providedIn: "root",
})
export class UpdateService {
    constructor(private apiService: ApiService) {}

    getInstalledRevisions(): Observable<InstalledRevisions> {
        return this.apiService.get(UrlConstants.SYSTEM_REVISION);
    }

    getStatus(): Observable<UpdateStatus> {
        return this.apiService.get(UrlConstants.SYSTEM_UPDATE_STATUS);
    }

    getLog(offset: number): Observable<UpdateLogResponse> {
        return this.apiService.get(
            `${UrlConstants.SYSTEM_UPDATE_LOG}?offset=${offset}`,
        );
    }

    startUpdate(request: UpdateRequest): Observable<UpdateJobResponse> {
        return this.apiService.post(UrlConstants.SYSTEM_UPDATE, request);
    }

    cancelUpdate(): Observable<{status: UpdateStatus}> {
        return this.apiService.post(UrlConstants.SYSTEM_UPDATE_CANCEL, {});
    }

    checkForUpdates(channel: UpdateChannel): Observable<UpdateCheckJob> {
        return this.apiService.post(UrlConstants.SYSTEM_UPDATE_CHECK, {
            channel,
        });
    }

    getAvailableUpdates(): Observable<AvailableUpdates> {
        return this.apiService.get(UrlConstants.SYSTEM_UPDATE_AVAILABLE);
    }
}
