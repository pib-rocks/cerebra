import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export type UpdateAvailability = boolean | "unknown";

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
    updateAvailable: UpdateAvailability;
    error?: string;
}

export interface AvailableUpdates {
    checkedAt?: string;
    repositories: Record<string, RepositoryAvailability>;
}

export interface UpdateStatus {
    state: string;
    classification?: string;
    message?: string;
    jobId?: string;
    channel?: string;
    force?: boolean;
    attempt?: number;
    maxAttempts?: number;
    predecessorInterrupted?: boolean;
    cancelRequested?: boolean;
    requestPending?: boolean;
    unhealthyServices?: string[];
    createdAt?: string;
    queuedAt?: string;
    startedAt?: string;
    updatedAt?: string;
    completedAt?: string;
    finishedAt?: string;
}

export interface UpdateJobResponse {
    job: UpdateStatus;
}

export interface UpdateLogResponse {
    offset: number;
    nextOffset: number;
    content: string;
}

export interface UpdateRequest {
    channel: string;
    force: boolean;
    confirmation: "UPDATE";
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

    checkForUpdates(): Observable<unknown> {
        return this.apiService.post(UrlConstants.SYSTEM_UPDATE_CHECK, {});
    }

    getAvailableUpdates(): Observable<AvailableUpdates> {
        return this.apiService.get(UrlConstants.SYSTEM_UPDATE_AVAILABLE);
    }
}
