import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {
    BrickletsStatusResponse,
    DockerContainer,
    DockerContainerLogs,
    SystemInfo,
} from "../types/system-info";

@Injectable({
    providedIn: "root",
})
export class SystemInfoService {
    constructor(
        private apiService: ApiService,
        private http: HttpClient,
    ) {}

    getSystemInfo(): Observable<SystemInfo> {
        return this.apiService.get(UrlConstants.SYSTEM_INFO);
    }

    getContainers(): Observable<DockerContainer[]> {
        return this.apiService
            .get(UrlConstants.SYSTEM_CONTAINERS)
            .pipe(map((response) => response.containers as DockerContainer[]));
    }

    getContainerLogs(
        name: string,
        tail = 200,
    ): Observable<DockerContainerLogs> {
        return this.apiService.get(
            `${UrlConstants.SYSTEM_CONTAINERS}/${encodeURIComponent(name)}/logs?tail=${tail}`,
        );
    }

    getBrickletsStatus(): Observable<BrickletsStatusResponse> {
        return this.apiService.get(UrlConstants.SYSTEM_BRICKLETS_STATUS);
    }

    downloadDiagnostics(): Observable<Blob> {
        return this.http.get(
            this.apiService.baseUrl + UrlConstants.SYSTEM_DIAGNOSTICS,
            {responseType: "blob"},
        );
    }
}
