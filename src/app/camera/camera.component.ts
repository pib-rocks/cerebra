import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ChangeDetectionStrategy,
} from "@angular/core";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Observable, Subscription, map} from "rxjs";
import {CameraSettings} from "../shared/types/camera-settings";
import {CameraService} from "../shared/services/camera.service";
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from "@ng-bootstrap/ng-bootstrap/dropdown";
import {NgbPopover} from "@ng-bootstrap/ng-bootstrap/popover";
import {HorizontalSliderComponent} from "../sliders/horizontal-slider/horizontal-slider.component";
import {
    Detection,
    DetectionArray,
} from "../shared/ros-types/msg/detection-array";
import {ModelListComponent} from "./model-list/model-list.component";

interface DetectionLayer {
    modelId: string;
    color: string;
    message?: DetectionArray;
}

interface OverlayKeypoint {
    name: string;
    x: number;
    y: number;
}

@Component({
    selector: "app-camera",
    templateUrl: "./camera.component.html",
    styleUrls: ["./camera.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        ReactiveFormsModule,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        NgbPopover,
        HorizontalSliderComponent,
        ModelListComponent,
    ],
})
export class CameraComponent implements OnInit, OnDestroy {
    private static readonly DETECTION_STALE_MS = 1500;
    private static readonly DIAGNOSTIC_WINDOW_MS = 5000;
    private static readonly DEFAULT_REFRESH_RATE_SECONDS = 0.1;

    @ViewChild("videobox") videoBox?: ElementRef;
    @ViewChild("refreshRate") refreshRateSlider!: ElementRef;
    @ViewChild("qualityFactor") qualityFactorSlider!: ElementRef;
    qualityReceiver$!: Observable<number[]>;
    refreshRateReceiver$!: Observable<number[]>;
    isLoading = false;
    toggleCamera = new FormControl(false);
    imageSrc!: string;
    selectedSize!: string;
    cameraActiveIcon =
        "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";

    cameraSettings: CameraSettings | undefined;
    cameraReceiverSubscription?: Subscription;
    cameraSettingsSubscription?: Subscription;
    detectionSubscription?: Subscription;
    detectionModelsSubscription?: Subscription;
    detectionClearSubscription?: Subscription;
    connectionStatusSubscription?: Subscription;
    detectionLayers = new Map<string, DetectionLayer>();
    detectionModels: DetectionLayer[] = [];
    cameraFramesLastWindow = 0;
    detectionMessagesLastWindow = 0;
    rosbridgeConnected = false;
    private detectionExpiryTimers = new Map<
        string,
        ReturnType<typeof setTimeout>
    >();
    private cameraFrameTimes: number[] = [];
    private detectionMessageTimes: number[] = [];
    private diagnosticTimer?: ReturnType<typeof setTimeout>;
    private displayRefreshTimer?: ReturnType<typeof setTimeout>;
    private pendingCameraFrame?: string;
    private imageIsLive = false;

    get visibleDetectionLayers(): DetectionLayer[] {
        if (!this.imageIsLive) return [];
        return this.detectionModels.filter(
            (layer) => layer.message !== undefined,
        );
    }

    constructor(private cameraService: CameraService) {
        this.subscribeCameraSettings();
    }

    ngOnInit(): void {
        this.imageSrc = "../../assets/camera-placeholder.jpg";
        this.cameraReceiverSubscription =
            this.cameraService.cameraReciver$.subscribe((message) => {
                this.receiveCameraFrame(message);
            });
        this.detectionModelsSubscription =
            this.cameraService.detectionModelsReceiver$.subscribe((models) =>
                this.updateDetectionModels(models),
            );
        this.detectionSubscription =
            this.cameraService.detectionReceiver$.subscribe((message) =>
                this.updateDetections(message),
            );
        this.detectionClearSubscription =
            this.cameraService.detectionClearReceiver$.subscribe((modelId) =>
                this.clearDetections(modelId),
            );
        this.qualityReceiver$ =
            this.cameraService.rosCameraQualityFactorReceiver.pipe(
                map((n) => [n]),
            );
        this.refreshRateReceiver$ = this.cameraService.cameraSettings.pipe(
            map((settings) => [
                settings.refreshRate ??
                    CameraComponent.DEFAULT_REFRESH_RATE_SECONDS,
            ]),
        );
        this.connectionStatusSubscription =
            this.cameraService.connectionStatus$.subscribe((connected) => {
                this.rosbridgeConnected = connected;
            });
    }

    ngOnDestroy(): void {
        this.cameraReceiverSubscription?.unsubscribe();
        this.cameraSettingsSubscription?.unsubscribe();
        this.detectionSubscription?.unsubscribe();
        this.detectionModelsSubscription?.unsubscribe();
        this.detectionClearSubscription?.unsubscribe();
        this.connectionStatusSubscription?.unsubscribe();
        if (this.diagnosticTimer !== undefined) {
            clearTimeout(this.diagnosticTimer);
        }
        this.clearDisplayRefreshTimer();
        this.clearDetections();
        this.stopCamera();
        if (this.cameraSettings) this.cameraSettings.isActive = false;
    }

    setSize(
        width: number,
        height: number,
        resolution: string,
        publish: boolean = true,
    ) {
        this.cameraSettings!.resX = width;
        this.cameraSettings!.resY = height;

        this.videoBox?.nativeElement.style.setProperty(
            "max-height",
            height + "px",
        );
        this.cameraSettings!.resolution = resolution;
        this.selectedSize = height + "px" + "(" + resolution + ")";
        if (publish) {
            this.isLoading = true;
            this.cameraService.setPreviewSize(width, height);
            setTimeout(() => {
                this.isLoading = false; // Stop the spinner
            }, 1500);
        }
        this.publishCameraSettings(this.cameraSettings!);
    }

    startCamera() {
        this.cameraService.startCamera();
    }

    stopCamera() {
        this.cameraService.stopCamera();
        this.pendingCameraFrame = undefined;
        this.clearDisplayRefreshTimer();
        this.imageSrc = "../../assets/camera-placeholder.jpg";
        this.imageIsLive = false;
        this.clearDetections();
    }

    keypoints(detection: Detection): OverlayKeypoint[] {
        const count = Math.min(
            detection.keypoint_x.length,
            detection.keypoint_y.length,
        );
        return Array.from({length: count}, (_, index) => ({
            name: detection.keypoint_names[index] ?? `Landmark ${index + 1}`,
            x: detection.keypoint_x[index],
            y: detection.keypoint_y[index],
        })).filter(
            (keypoint) =>
                Number.isFinite(keypoint.x) && Number.isFinite(keypoint.y),
        );
    }

    detectionLabel(detection: Detection): string {
        const percentage = Number.isFinite(detection.score)
            ? ` ${Math.round(detection.score * 100)}%`
            : "";
        return `${detection.label}${percentage}`;
    }

    private updateDetectionModels(modelIds: string[]) {
        const availableModels = new Set(modelIds);
        for (const modelId of modelIds) {
            this.ensureDetectionLayer(modelId);
        }
        this.detectionModels = [...this.detectionLayers.values()].filter(
            (layer) => availableModels.has(layer.modelId),
        );
    }

    private updateDetections(message: DetectionArray) {
        this.detectionMessageTimes.push(Date.now());
        this.updateDiagnostics();
        if (
            !message.model_id ||
            message.frame_width <= 0 ||
            message.frame_height <= 0
        ) {
            return;
        }

        const layer = this.ensureDetectionLayer(message.model_id);
        layer.message = message;
        if (!this.detectionModels.includes(layer)) {
            this.detectionModels = [...this.detectionModels, layer];
        }

        const oldTimer = this.detectionExpiryTimers.get(message.model_id);
        if (oldTimer !== undefined) clearTimeout(oldTimer);
        this.detectionExpiryTimers.set(
            message.model_id,
            setTimeout(
                () => this.clearDetections(message.model_id),
                CameraComponent.DETECTION_STALE_MS,
            ),
        );
    }

    private ensureDetectionLayer(modelId: string): DetectionLayer {
        let layer = this.detectionLayers.get(modelId);
        if (!layer) {
            layer = {
                modelId,
                color: this.modelColor(modelId),
            };
            this.detectionLayers.set(modelId, layer);
        }
        return layer;
    }

    private clearDetections(modelId?: string) {
        const modelIds = modelId ? [modelId] : [...this.detectionLayers.keys()];
        for (const id of modelIds) {
            const layer = this.detectionLayers.get(id);
            if (layer) layer.message = undefined;
            const timer = this.detectionExpiryTimers.get(id);
            if (timer !== undefined) clearTimeout(timer);
            this.detectionExpiryTimers.delete(id);
        }
    }

    private modelColor(modelId: string): string {
        let hash = 0;
        for (const character of modelId) {
            hash = (hash * 31 + character.charCodeAt(0)) % 360;
        }
        return `hsl(${hash}, 85%, 55%)`;
    }

    toggleCameraState() {
        if (!this.cameraSettings!.isActive) {
            this.startCamera();
        } else {
            this.stopCamera();
        }
        this.cameraSettings!.isActive = !this.cameraSettings!.isActive;
        this.changeCameraIcon();
        this.publishCameraSettings(this.cameraSettings!);
    }

    changeCameraIcon() {
        if (this.cameraSettings!.isActive) {
            this.cameraActiveIcon =
                "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h520q24 0 42 18t18 42v215l160-160v410L720-435v215q0 24-18 42t-42 18H140Z";
        } else {
            this.cameraActiveIcon =
                "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
        }
    }

    updateRefreshRateLabel(sliderNumber: number) {
        this.cameraSettings!.refreshRate = sliderNumber;
        this.clearDisplayRefreshTimer();
        if (this.pendingCameraFrame !== undefined) {
            this.displayPendingCameraFrame();
        }
    }

    updateQualityFactorLabel(sliderNumber: number) {
        this.cameraSettings!.qualityFactor = sliderNumber;
    }

    removeCssClass() {
        const videoSettingsButton = document.getElementById("videosettings");
        videoSettingsButton?.classList.remove("showPopover");
    }

    addCssClass() {
        const videoSettingsButton = document.getElementById("videosettings");
        videoSettingsButton?.classList.add("showPopover");
    }

    subscribeCameraSettings() {
        this.cameraSettingsSubscription =
            this.cameraService.cameraSettings.subscribe(
                (message: CameraSettings) => {
                    this.cameraSettings = message;
                },
            );
    }

    publishCameraSettings(cameraSettings: CameraSettings) {
        this.cameraService.publishCameraSettings(cameraSettings);
    }

    qualityControlPublish = (formControlValue: number) => {
        this.cameraService.qualityControlPublish(formControlValue);
    };

    refreshRatePublish = (formControlValue: number) => {
        this.cameraService.refreshRatePublish(formControlValue);
    };

    private receiveCameraFrame(message: string) {
        this.cameraFrameTimes.push(Date.now());
        this.updateDiagnostics();

        if (message.startsWith("Camera not available")) {
            this.pendingCameraFrame = undefined;
            this.clearDisplayRefreshTimer();
            this.imageSrc = "../../assets/camera-error-image.svg";
            this.imageIsLive = false;
            this.clearDetections();
            return;
        }

        this.pendingCameraFrame = "data:image/jpeg;base64," + message;
        this.imageIsLive = true;
        if (this.displayRefreshTimer === undefined) {
            this.displayPendingCameraFrame();
        }
    }

    private displayPendingCameraFrame() {
        if (this.pendingCameraFrame === undefined) return;
        this.imageSrc = this.pendingCameraFrame;
        this.pendingCameraFrame = undefined;
        this.displayRefreshTimer = setTimeout(() => {
            this.displayRefreshTimer = undefined;
            this.displayPendingCameraFrame();
        }, this.displayRefreshDelayMs());
    }

    private displayRefreshDelayMs(): number {
        const refreshRate = this.cameraSettings?.refreshRate;
        const seconds =
            refreshRate !== undefined && refreshRate > 0
                ? refreshRate
                : CameraComponent.DEFAULT_REFRESH_RATE_SECONDS;
        return seconds * 1000;
    }

    private clearDisplayRefreshTimer() {
        if (this.displayRefreshTimer !== undefined) {
            clearTimeout(this.displayRefreshTimer);
            this.displayRefreshTimer = undefined;
        }
    }

    private updateDiagnostics() {
        const now = Date.now();
        const cutoff = now - CameraComponent.DIAGNOSTIC_WINDOW_MS;
        this.cameraFrameTimes = this.cameraFrameTimes.filter(
            (timestamp) => timestamp >= cutoff,
        );
        this.detectionMessageTimes = this.detectionMessageTimes.filter(
            (timestamp) => timestamp >= cutoff,
        );
        this.cameraFramesLastWindow = this.cameraFrameTimes.length;
        this.detectionMessagesLastWindow = this.detectionMessageTimes.length;

        if (
            this.diagnosticTimer === undefined &&
            (this.cameraFrameTimes.length > 0 ||
                this.detectionMessageTimes.length > 0)
        ) {
            const oldestTimestamp = Math.min(
                this.cameraFrameTimes[0] ?? Number.POSITIVE_INFINITY,
                this.detectionMessageTimes[0] ?? Number.POSITIVE_INFINITY,
            );
            this.diagnosticTimer = setTimeout(
                () => {
                    this.diagnosticTimer = undefined;
                    this.updateDiagnostics();
                },
                Math.max(
                    0,
                    oldestTimestamp +
                        CameraComponent.DIAGNOSTIC_WINDOW_MS -
                        now +
                        1,
                ),
            );
        }
    }
}
