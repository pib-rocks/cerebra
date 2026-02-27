import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable, catchError, throwError} from "rxjs";

export interface OpenClawInstance {
    id: string;
    userId: string;
    containerId?: string;
    status: "running" | "stopped" | "starting" | "stopping" | "error";
    port?: number;
    subdomain?: string;
    config: Record<string, unknown>;
    createdAt: string;
    lastActiveAt?: string;
}

export interface OpenClawInstanceDto {
    id: string;
    user_id: string;
    container_id?: string;
    status: "running" | "stopped" | "starting" | "stopping" | "error";
    port?: number;
    subdomain?: string;
    config: Record<string, unknown>;
    created_at: string;
    last_active_at?: string;
}

export interface CreateInstanceRequest {
    config?: Record<string, unknown>;
}

@Injectable({
    providedIn: "root",
})
export class OpenclawService {
    private readonly baseUrl = "/api/instances";

    private readonly instancesSubject = new BehaviorSubject<OpenClawInstance[]>(
        [],
    );
    readonly instances$ = this.instancesSubject.asObservable();

    constructor(private readonly http: HttpClient) {}

    private parseDto(dto: OpenClawInstanceDto): OpenClawInstance {
        return {
            id: dto.id,
            userId: dto.user_id,
            containerId: dto.container_id,
            status: dto.status,
            port: dto.port,
            subdomain: dto.subdomain,
            config: dto.config,
            createdAt: dto.created_at,
            lastActiveAt: dto.last_active_at,
        };
    }

    private handleError(err: unknown): Observable<never> {
        return throwError(() => {
            console.error(err);
        });
    }

    getAllInstances(): Observable<OpenClawInstance[]> {
        return new Observable((observer) => {
            this.http
                .get<{instances: OpenClawInstanceDto[]}>(this.baseUrl)
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe((response) => {
                    const instances = response.instances.map((dto) =>
                        this.parseDto(dto),
                    );
                    this.instancesSubject.next(instances);
                    observer.next(instances);
                    observer.complete();
                });
        });
    }

    getInstanceStatus(instanceId: string): Observable<OpenClawInstance> {
        return new Observable((observer) => {
            this.http
                .get<OpenClawInstanceDto>(
                    `${this.baseUrl}/${instanceId}/status`,
                )
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe((dto) => {
                    const instance = this.parseDto(dto);
                    this.updateInstanceInCache(instance);
                    observer.next(instance);
                    observer.complete();
                });
        });
    }

    createInstance(
        request: CreateInstanceRequest = {},
    ): Observable<OpenClawInstance> {
        return new Observable((observer) => {
            this.http
                .post<OpenClawInstanceDto>(this.baseUrl, request)
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe((dto) => {
                    const instance = this.parseDto(dto);
                    const current = this.instancesSubject.value;
                    this.instancesSubject.next([...current, instance]);
                    observer.next(instance);
                    observer.complete();
                });
        });
    }

    startInstance(instanceId: string): Observable<OpenClawInstance> {
        return new Observable((observer) => {
            this.http
                .put<OpenClawInstanceDto>(
                    `${this.baseUrl}/${instanceId}/start`,
                    {},
                )
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe((dto) => {
                    const instance = this.parseDto(dto);
                    this.updateInstanceInCache(instance);
                    observer.next(instance);
                    observer.complete();
                });
        });
    }

    stopInstance(instanceId: string): Observable<OpenClawInstance> {
        return new Observable((observer) => {
            this.http
                .put<OpenClawInstanceDto>(
                    `${this.baseUrl}/${instanceId}/stop`,
                    {},
                )
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe((dto) => {
                    const instance = this.parseDto(dto);
                    this.updateInstanceInCache(instance);
                    observer.next(instance);
                    observer.complete();
                });
        });
    }

    deleteInstance(instanceId: string): Observable<void> {
        return new Observable((observer) => {
            this.http
                .delete(`${this.baseUrl}/${instanceId}`)
                .pipe(catchError((err) => this.handleError(err)))
                .subscribe(() => {
                    const current = this.instancesSubject.value;
                    this.instancesSubject.next(
                        current.filter((i) => i.id !== instanceId),
                    );
                    observer.next();
                    observer.complete();
                });
        });
    }

    getInstanceLogs(
        instanceId: string,
        lines = 100,
    ): Observable<{logs: string[]}> {
        return this.http
            .get<{
                logs: string[];
            }>(`${this.baseUrl}/${instanceId}/logs?lines=${lines}`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    private updateInstanceInCache(updated: OpenClawInstance): void {
        const current = this.instancesSubject.value;
        const index = current.findIndex((i) => i.id === updated.id);
        if (index === -1) return;
        const next = current.slice();
        next[index] = updated;
        this.instancesSubject.next(next);
    }
}
