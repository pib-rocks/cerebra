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

/** Readable names in the order the panel shows them. The camera manifest is not this order. */
const READABLE_MODEL_NAMES: ReadonlyArray<readonly [string, string]> = [
    ["face_detection_yunet_160x120", "Face detection"],
    ["yolov6n_coco_640x640", "Object detection"],
    ["hand_tracking_fast", "Hand tracking"],
    ["emotion_recognition_crop", "Emotion recognition"],
    ["head_pose_estimation_crop", "Head pose estimation"],
    ["qr_code_detection_384x384", "QR-Code detection"],
];

const MODEL_LABELS = new Map(READABLE_MODEL_NAMES);
const MODEL_ORDER = new Map(
    READABLE_MODEL_NAMES.map(([modelId], index) => [modelId, index]),
);

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
    /**
     * SHAVE slots the camera reported. `0` (or a missing field) means unknown:
     * hide the free-slot count and do not refuse a start for lack of slots.
     */
    totalShaves = 0;
    statuses = new Map<string, ModelStatus>();
    actionsInFlight = new Set<string>();
    loading = true;
    error?: string;

    /** Starts accepted locally, before `/models_status` confirms or rejects them. */
    private reservedModelIds = new Set<string>();
    private readonly subscriptions = new Subscription();
    private statusExpiryTimer?: ReturnType<typeof setTimeout>;

    constructor(private rosService: RosService) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.rosService.modelStatusReceiver$.subscribe(({models}) => {
                this.statuses = new Map(
                    models.map((status) => [status.model_id, status]),
                );
                this.reconcileReservations();
                this.resetStatusExpiry();
            }),
        );
        this.subscriptions.add(
            this.rosService.connectionStatus$.subscribe((connected) => {
                if (connected) {
                    this.loadModels();
                } else {
                    this.models = [];
                    this.totalShaves = 0;
                    this.reservedModelIds = new Set();
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
        this.runAction(
            model.model_id,
            () => {
                if (active) this.reserve(model.model_id);
                else this.release(model.model_id);
                return active
                    ? this.rosService.startModel(
                          model,
                          ModelListComponent.OWNER,
                      )
                    : this.rosService.stopModel(
                          model.model_id,
                          ModelListComponent.OWNER,
                      );
            },
            active
                ? () => {
                      this.release(model.model_id);
                      this.markInactive(model.model_id);
                  }
                : undefined,
        );
    }

    labelFor(model: ModelInfo): string {
        return MODEL_LABELS.get(model.model_id) || model.task || model.model_id;
    }

    slotLine(model: ModelInfo): string {
        return `${model.model_id} (${model.shaves} Slots)`;
    }

    slotsKnown(): boolean {
        return this.totalShaves > 0;
    }

    freeSlots(): number {
        return this.totalShaves - this.usedSlots();
    }

    freeSlotsLabel(): string {
        return `Free slots: ${this.freeSlots()}`;
    }

    toggleDisabled(model: ModelInfo): boolean {
        return (
            !model.available ||
            this.actionsInFlight.has(model.model_id) ||
            this.startRefusedForSlots(model)
        );
    }

    toggleAriaLabel(model: ModelInfo): string {
        return this.refusalText(model) ?? `Run ${this.labelFor(model)}`;
    }

    toggleTitle(model: ModelInfo): string | null {
        return this.refusalText(model);
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

    private startRefusedForSlots(model: ModelInfo): boolean {
        return (
            this.slotsKnown() &&
            model.available &&
            !this.isActive(model) &&
            !this.actionsInFlight.has(model.model_id) &&
            model.shaves > this.freeSlots()
        );
    }

    private refusalText(model: ModelInfo): string | null {
        if (!this.startRefusedForSlots(model)) return null;
        return `Not enough free slots (needs ${
            model.shaves
        }, ${this.freeSlots()} free)`;
    }

    private usedSlots(): number {
        let used = 0;
        for (const model of this.models) {
            if (this.occupiesSlots(model)) used += model.shaves;
        }
        return used;
    }

    private occupiesSlots(model: ModelInfo): boolean {
        const status = this.statusFor(model.model_id);
        if (status?.state === "failed") return false;
        return (
            this.reservedModelIds.has(model.model_id) || this.isActive(model)
        );
    }

    private reserve(modelId: string): void {
        if (this.reservedModelIds.has(modelId)) return;
        this.reservedModelIds = new Set(this.reservedModelIds).add(modelId);
    }

    private release(modelId: string): void {
        if (!this.reservedModelIds.has(modelId)) return;
        const reserved = new Set(this.reservedModelIds);
        reserved.delete(modelId);
        this.reservedModelIds = reserved;
    }

    private markInactive(modelId: string): void {
        const model = this.models.find((item) => item.model_id === modelId);
        if (model) model.active = false;
    }

    private reconcileReservations(): void {
        const reserved = new Set(this.reservedModelIds);
        let changed = false;
        for (const status of this.statuses.values()) {
            if (status.state === "failed") {
                this.markInactive(status.model_id);
                if (reserved.delete(status.model_id)) changed = true;
                continue;
            }
            if (!status.active || !reserved.has(status.model_id)) continue;
            reserved.delete(status.model_id);
            changed = true;
            const model = this.models.find(
                (item) => item.model_id === status.model_id,
            );
            if (model) model.active = true;
        }
        if (changed) this.reservedModelIds = reserved;
    }

    private sortModels(models: ModelInfo[]): ModelInfo[] {
        return models
            .map((model, index) => ({model, index}))
            .sort((left, right) => {
                const leftOrder = MODEL_ORDER.get(left.model.model_id);
                const rightOrder = MODEL_ORDER.get(right.model.model_id);
                if (leftOrder !== undefined && rightOrder !== undefined) {
                    return leftOrder - rightOrder;
                }
                if (leftOrder !== undefined) return -1;
                if (rightOrder !== undefined) return 1;
                return left.index - right.index;
            })
            .map(({model}) => model);
    }

    private loadModels(): void {
        this.loading = true;
        this.subscriptions.add(
            this.rosService
                .listModels()
                .pipe(finalize(() => (this.loading = false)))
                .subscribe({
                    next: (response) => {
                        const models = this.sortModels(response.models ?? []);
                        for (const model of models) {
                            if (this.reservedModelIds.has(model.model_id)) {
                                model.active = true;
                            }
                        }
                        this.models = models;
                        this.totalShaves = response.total_shaves || 0;
                        this.error = undefined;
                    },
                    error: (error: unknown) => {
                        this.models = [];
                        this.totalShaves = 0;
                        this.error = this.errorMessage(
                            error,
                            "Could not load models.",
                        );
                    },
                }),
        );
    }

    private runAction(
        modelId: string,
        action: () => Observable<void>,
        rollback?: () => void,
    ) {
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
                        rollback?.();
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
