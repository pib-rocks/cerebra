import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
} from "@angular/core";
import {Observable, Subscription, finalize} from "rxjs";
import {ModelState, ModelStatus} from "../../shared/ros-types/msg/model-status";
import {ModelInfo} from "../../shared/ros-types/srv/list-models";
import {RosService} from "../../shared/services/ros-service/ros.service";

@Component({
    selector: "app-model-list",
    templateUrl: "./model-list.component.html",
    styleUrls: ["./model-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class ModelListComponent implements OnInit, OnDestroy {
    private static readonly OWNER = "cerebra-ui";
    private static readonly STATUS_STALE_MS = 2500;

    models: ModelInfo[] = [];
    statuses = new Map<string, ModelStatus>();
    actionsInFlight = new Set<string>();
    loading = true;
    error?: string;

    private readonly subscriptions = new Subscription();
    private statusExpiryTimer?: ReturnType<typeof setTimeout>;

    constructor(private rosService: RosService) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.rosService.modelStatusReceiver$.subscribe(({models}) => {
                this.statuses = new Map(
                    models.map((status) => [status.model_id, status]),
                );
                this.resetStatusExpiry();
            }),
        );
        this.subscriptions.add(
            this.rosService.connectionStatus$.subscribe((connected) => {
                if (connected) {
                    this.loadModels();
                } else {
                    this.models = [];
                    this.loading = false;
                    this.clearStatuses();
                }
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.clearStatusExpiry();
    }

    setModelActive(model: ModelInfo, active: boolean): void {
        model.active = active;
        this.runAction(model.model_id, () =>
            active
                ? this.rosService.startModel(model, ModelListComponent.OWNER)
                : this.rosService.stopModel(
                      model.model_id,
                      ModelListComponent.OWNER,
                  ),
        );
    }

    statusFor(modelId: string): ModelStatus | undefined {
        return this.statuses.get(modelId);
    }

    isActive(model: ModelInfo): boolean {
        return this.statusFor(model.model_id)?.active ?? model.active;
    }

    stateFor(model: ModelInfo): ModelState {
        return (
            this.statusFor(model.model_id)?.state ??
            (this.isActive(model) ? "running" : "idle")
        );
    }

    statusText(model: ModelInfo): string {
        const status = this.statusFor(model.model_id);
        const state = this.stateFor(model);
        return status?.active && Number.isFinite(status.fps)
            ? `${state} · ${status.fps.toFixed(1)} FPS`
            : state;
    }

    private loadModels(): void {
        this.loading = true;
        this.subscriptions.add(
            this.rosService
                .listModels()
                .pipe(finalize(() => (this.loading = false)))
                .subscribe({
                    next: (models) => {
                        this.models = models;
                        this.error = undefined;
                    },
                    error: (error: unknown) => {
                        this.models = [];
                        this.error = this.errorMessage(
                            error,
                            "Could not load models.",
                        );
                    },
                }),
        );
    }

    private runAction(modelId: string, action: () => Observable<void>) {
        if (this.actionsInFlight.has(modelId)) return;
        this.actionsInFlight = new Set(this.actionsInFlight).add(modelId);
        this.error = undefined;
        this.subscriptions.add(
            action()
                .pipe(
                    finalize(() => {
                        const actionsInFlight = new Set(this.actionsInFlight);
                        actionsInFlight.delete(modelId);
                        this.actionsInFlight = actionsInFlight;
                        this.loadModels();
                    }),
                )
                .subscribe({
                    error: (error: unknown) => {
                        this.error = this.errorMessage(
                            error,
                            `Could not update ${modelId}.`,
                        );
                    },
                }),
        );
    }

    private resetStatusExpiry(): void {
        this.clearStatusExpiry();
        if (this.statuses.size === 0) return;
        this.statusExpiryTimer = setTimeout(
            () => this.clearStatuses(),
            ModelListComponent.STATUS_STALE_MS,
        );
    }

    private clearStatuses(): void {
        this.statuses = new Map();
        this.clearStatusExpiry();
    }

    private clearStatusExpiry(): void {
        if (this.statusExpiryTimer !== undefined) {
            clearTimeout(this.statusExpiryTimer);
            this.statusExpiryTimer = undefined;
        }
    }

    private errorMessage(error: unknown, fallback: string): string {
        return error instanceof Error && error.message
            ? error.message
            : fallback;
    }
}
