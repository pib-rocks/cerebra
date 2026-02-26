import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subject, interval} from "rxjs";
import {switchMap, takeUntil} from "rxjs/operators";
import {
    OpenClawInstance,
    OpenclawService,
} from "../shared/services/openclaw.service";

@Component({
    selector: "app-openclaw",
    templateUrl: "./openclaw.component.html",
    styleUrls: ["./openclaw.component.scss"],
})
export class OpenclawComponent implements OnInit, OnDestroy {
    instances: OpenClawInstance[] = [];
    selectedInstance: OpenClawInstance | null = null;
    logs: string[] = [];
    isLoadingInstances = false;
    isCreating = false;
    activeAction: Record<string, boolean> = {};

    private readonly destroy$ = new Subject<void>();
    private readonly POLL_INTERVAL_MS = 10_000;

    constructor(private readonly openclawService: OpenclawService) {}

    ngOnInit(): void {
        this.loadInstances();

        this.openclawService.instances$
            .pipe(takeUntil(this.destroy$))
            .subscribe((instances) => {
                this.instances = instances;
                if (this.selectedInstance) {
                    this.selectedInstance =
                        instances.find(
                            (i) => i.id === this.selectedInstance!.id,
                        ) ?? null;
                }
            });

        interval(this.POLL_INTERVAL_MS)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.openclawService.getAllInstances()),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadInstances(): void {
        this.isLoadingInstances = true;
        this.openclawService.getAllInstances().subscribe({
            next: () => (this.isLoadingInstances = false),
            error: () => (this.isLoadingInstances = false),
        });
    }

    selectInstance(instance: OpenClawInstance): void {
        this.selectedInstance = instance;
        this.logs = [];
        this.loadLogs(instance.id);
    }

    createInstance(): void {
        this.isCreating = true;
        this.openclawService.createInstance().subscribe({
            next: (instance) => {
                this.isCreating = false;
                this.selectInstance(instance);
            },
            error: () => (this.isCreating = false),
        });
    }

    startInstance(instance: OpenClawInstance, event: Event): void {
        event.stopPropagation();
        this.activeAction[instance.id] = true;
        this.openclawService.startInstance(instance.id).subscribe({
            next: () => (this.activeAction[instance.id] = false),
            error: () => (this.activeAction[instance.id] = false),
        });
    }

    stopInstance(instance: OpenClawInstance, event: Event): void {
        event.stopPropagation();
        this.activeAction[instance.id] = true;
        this.openclawService.stopInstance(instance.id).subscribe({
            next: () => (this.activeAction[instance.id] = false),
            error: () => (this.activeAction[instance.id] = false),
        });
    }

    deleteInstance(instance: OpenClawInstance, event: Event): void {
        event.stopPropagation();
        this.activeAction[instance.id] = true;
        this.openclawService.deleteInstance(instance.id).subscribe({
            next: () => {
                this.activeAction[instance.id] = false;
                if (this.selectedInstance?.id === instance.id) {
                    this.selectedInstance = null;
                    this.logs = [];
                }
            },
            error: () => (this.activeAction[instance.id] = false),
        });
    }

    loadLogs(instanceId: string): void {
        this.openclawService.getInstanceLogs(instanceId).subscribe({
            next: (response) => (this.logs = response.logs),
        });
    }

    refreshLogs(): void {
        if (this.selectedInstance) {
            this.loadLogs(this.selectedInstance.id);
        }
    }

    getStatusClass(status: OpenClawInstance["status"]): string {
        const map: Record<OpenClawInstance["status"], string> = {
            running: "status-running",
            stopped: "status-stopped",
            starting: "status-transitioning",
            stopping: "status-transitioning",
            error: "status-error",
        };
        return map[status];
    }

    isTransitioning(instance: OpenClawInstance): boolean {
        return (
            instance.status === "starting" ||
            instance.status === "stopping" ||
            !!this.activeAction[instance.id]
        );
    }

    get instanceUrl(): string | null {
        if (!this.selectedInstance?.subdomain) return null;
        return `https://${this.selectedInstance.subdomain}.openclaw.cloud`;
    }
}
