import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Subject} from "rxjs";
import {CameraService} from "../shared/services/camera.service";
import {CameraSetting} from "../shared/types/camera-settings";

@Component({
    selector: "app-camera",
    templateUrl: "./camera.component.html",
    styleUrls: ["./camera.component.css"],
})
export class CameraComponent implements OnInit, OnDestroy {
    @ViewChild("videobox") videoBox?: ElementRef;
    qualityReceiver$!: Subject<number>;
    refreshRateReceiver$!: Subject<number>;
    isLoading = false;
    toggleCamera = new FormControl(false);
    imageSrc!: string;
    selectedSize!: string;
    cameraActiveIcon =
        "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";

    cameraSettings: CameraSetting | undefined;

    constructor(private cameraService: CameraService) {
        this.subscribeCameraSettings();
    }

    ngOnInit(): void {
        this.subscribeCameraReseiver();
        this.imageSrc = "../../assets/camera-placeholder.jpg";
        this.cameraService.cameraReciver$.subscribe((message) => {
            this.imageSrc = "data:image/jpeg;base64," + message;
            if (message.startsWith("Camera not available")) {
                this.imageSrc = "../../assets/camera-error-image.svg";
            }
        });
        this.qualityReceiver$ =
            this.cameraService.rosCameraQualityFactorReceiver;
        this.refreshRateReceiver$ =
            this.cameraService.rosCameraTimerPeriodReceiver;
    }

    ngOnDestroy(): void {
        this.stopCamera();
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

    arraysEqual(a: number[], b: number[]) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    startCamera() {
        this.cameraService.startCamera();
    }

    stopCamera() {
        this.cameraService.stopCamera();
        this.imageSrc = "../../assets/camera-placeholder.jpg";
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

    subscribeCameraReseiver() {
        this.cameraService.subscribeCameraReseiver();
    }

    subscribeCameraSettings() {
        this.cameraService.cameraSettings.subscribe(
            (message: CameraSetting) => {
                this.cameraSettings = message;
            },
        );
    }

    publishCameraSettings(cameraSettings: CameraSetting) {
        this.cameraService.publishCameraSettings(cameraSettings);
    }

    qualityControlPublish = (formControlValue: number) => {
        this.cameraService.qualityControlPublish(formControlValue);
    };

    refreshRatePublish = (formControlValue: number) => {
        this.cameraService.refreshRatePublish(formControlValue);
    };
}
