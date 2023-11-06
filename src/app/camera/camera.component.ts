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
    isCameraActive = false;
    toggleCamera = new FormControl(false);
    imageSrc!: string;
    refreshRateControl: number = 0.1;
    qualityFactorControl: number = 80;
    selectedSize!: string;
    resX!: number;
    resY!: number;
    resolution!: string;
    cameraActiveIcon =
        "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
    constructor(private cameraService: CameraService) {
        this.subscribeCameraQualityFactorSubject();
        this.subscribeCameraResolutinSubject();
        this.subscribeCameraTimerPeriodSubject();
        this.subscribeCameraResXSubject();
        this.subscribeCameraResYSubject();
    }

    ngOnInit(): void {
        this.cameraService.getCameraSettings();
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
        this.resX = width;
        this.resY = height;

        this.cameraService.cameraResXSubject.next(this.resX);
        this.cameraService.cameraResYSubject.next(this.resY);

        this.videoBox?.nativeElement.style.setProperty(
            "max-height",
            this.resY + "px",
        );
        this.selectedSize = resolution;
        if (publish) {
            this.isLoading = true;
            this.cameraService.setPreviewSize(this.resX, this.resY);
            setTimeout(() => {
                this.isLoading = false; // Stop the spinner
            }, 1500);
        }
        this.saveSettings();
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
        if (!this.isCameraActive) {
            this.startCamera();
        } else {
            this.stopCamera();
        }
        this.isCameraActive = !this.isCameraActive;
        this.changeCameraIcon();
    }

    changeCameraIcon() {
        if (this.isCameraActive) {
            this.cameraActiveIcon =
                "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h520q24 0 42 18t18 42v215l160-160v410L720-435v215q0 24-18 42t-42 18H140Z";
        } else {
            this.cameraActiveIcon =
                "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
        }
    }

    updateRefreshRateLabel(sliderNumber: number) {
        this.refreshRateControl = sliderNumber;
    }

    updateQualityFactorLabel(sliderNumber: number) {
        this.qualityFactorControl = sliderNumber;
    }

    removeCssClass() {
        const videoSettingsButton = document.getElementById("videosettings");
        videoSettingsButton?.classList.remove("showPopover");
    }
    addCssClass() {
        const videoSettingsButton = document.getElementById("videosettings");
        videoSettingsButton?.classList.add("showPopover");
    }

    qualityControlPublish = (formControlValue: number) => {
        this.cameraService.qualityControlPublish(formControlValue);
    };
    refreshRatePublish = (formControlValue: number) => {
        this.cameraService.refreshRatePublish(formControlValue);
    };

    subscribeCameraQualityFactorSubject() {
        this.cameraService.qualityFactorSubject.subscribe((message: number) => {
            this.qualityFactorControl = message;
        });
    }
    subscribeCameraResXSubject() {
        this.cameraService.cameraResXSubject.subscribe((message: number) => {
            this.resX = message;
        });
    }
    subscribeCameraResYSubject() {
        this.cameraService.cameraResYSubject.subscribe((message: number) => {
            this.resY = message;
        });
    }
    subscribeCameraTimerPeriodSubject() {
        this.cameraService.cameraTimerPeriodSubject.subscribe(
            (message: number) => {
                this.refreshRateControl = message;
            },
        );
    }
    subscribeCameraResolutinSubject() {
        this.cameraService.cameraResolutinSubject.subscribe(
            (message: string) => {
                this.selectedSize = this.resY + "p (" + message + ")";
                this.resolution = message;
            },
        );
    }
    subscribeCameraIsActiveSubject() {
        this.cameraService.cameraIsActiveSubject.subscribe(
            (message: boolean) => {
                this.isCameraActive = message;
            },
        );
    }

    saveSettings() {
        this.cameraService.saveCameraSettings();
    }

    subscribeCameraReseiver() {
        this.cameraService.subscribeCameraReseiver();
    }
}
