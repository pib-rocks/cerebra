import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

export interface DockerContainer {
    id?: string;
    name: string;
    image?: string;
    status: string;
    statusText?: string;
    health?: string;
    created?: number;
}

export interface ContainerActionResponse {
    status: string;
    message?: string;
}

export interface ContainerLogsResponse {
    status: string;
    container?: string;
    logs?: string;
    message?: string;
}

@Injectable({
    providedIn: "root",
})
export class DockerService {
    constructor(private apiService: ApiService) {}

    getContainers(): Observable<DockerContainer[]> {
        return this.apiService.get(`${UrlConstants.DOCKER}/containers`);
    }

    startContainer(name: string): Observable<ContainerActionResponse> {
        return this.apiService.post(
            `${UrlConstants.DOCKER}/containers/${name}/start`,
            {},
        );
    }

    stopContainer(name: string): Observable<ContainerActionResponse> {
        return this.apiService.post(
            `${UrlConstants.DOCKER}/containers/${name}/stop`,
            {},
        );
    }

    restartContainer(name: string): Observable<ContainerActionResponse> {
        return this.apiService.post(
            `${UrlConstants.DOCKER}/containers/${name}/restart`,
            {},
        );
    }

    getContainerLogs(
        name: string,
        tail: number = 500,
    ): Observable<ContainerLogsResponse> {
        return this.apiService.get(
            `${UrlConstants.DOCKER}/containers/${name}/logs?tail=${tail}`,
        );
    }

    clearContainerLogs(name: string): Observable<ContainerActionResponse> {
        return this.apiService.post(
            `${UrlConstants.DOCKER}/containers/${name}/clear-logs`,
            {},
        );
    }

    purgeDocker(): Observable<ContainerActionResponse> {
        return this.apiService.post(`${UrlConstants.DOCKER}/admin/purge`, {});
    }
}
