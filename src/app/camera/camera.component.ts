import {
    Component,
    ElementRef,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {RosService} from "../shared/ros.service";
import {Subject} from "rxjs";
import {CameraService} from "../shared/services/camera.service";
import {CameraSetting} from "../shared/types/camera-settings";

@Component({
    selector: "app-camera",
    templateUrl: "./camera.component.html",
    styleUrls: ["./camera.component.css"],
})
export class CameraComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild("videobox") videoBox?: ElementRef;
    qualityReceiver$!: Subject<number>;
    refreshRateReceiver$!: Subject<number>;
    isLoading = false;
    isCameraActive = false;
    toggleCamera = new FormControl(false);
    imageSrc!: string;
    refreshRateControl: number = 0.1;
    qualityFactorControl: number = 80;
    selectedSize = "480p (SD)";
    cameraActiveIcon =
        "M880-275 720-435v111L244-800h416q24 0 42 18t18 42v215l160-160v410ZM848-27 39-836l42-42L890-69l-42 42ZM159-800l561 561v19q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h19Z";
    constructor(
        private rosService: RosService,
        private cameraService: CameraService,
    ) {
        this.subscribeCameraQualityFactorSubject();
        this.subscribeCameraPreviewSizeSubject();
        this.subscribeCameraResolutinSubject();
        this.subscribeCameraTimerPeriodSubject();
    }

    ngOnInit(): void {
        this.imageSrc = "../../assets/camera-placeholder.jpg";
        this.rosService.cameraReceiver$.subscribe((message) => {
            this.imageSrc = "data:image/jpeg;base64," + message;
            console.log("-------------------------");
            if (message.startsWith("Camera not available")) {
                this.imageSrc = "../../assets/camera-error-image.svg";
            }
        });
        this.rosService.Ros.on("error", (error: string) => {
            if (this.isCameraActive) {
                this.imageSrc = "../../assets/camera-error-image.svg";
                console.error(error);
            }
        });
        //in cameraServie verlagern
        this.qualityReceiver$ = this.rosService.cameraQualityFactorReceiver$;
        this.refreshRateReceiver$ = this.rosService.cameraTimerPeriodReceiver$;
    }
    ngOnChanges(): void {
        this.cameraService.saveCameraSettings();
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
        this.videoBox?.nativeElement.style.setProperty(
            "max-height",
            height + "px",
        );

        if (publish) {
            this.isLoading = true;
            this.cameraService.setPreviewSize(width, height);
            setTimeout(() => {
                this.isLoading = false; // Stop the spinner
            }, 1500);
        }
    }

    arraysEqual(a: number[], b: number[]) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    startCamera() {
        this.cameraService.stopCamera();
    }

    stopCamera() {
        this.cameraService.startCamera();
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
    subscribeCameraPreviewSizeSubject() {
        this.cameraService.cameraPreviewSizeSubject.subscribe(
            (message: number[]) => {
                if (message[1] == 480)
                    this.setSize(message[0], message[1], "SD");
                if (message[1] == 720)
                    this.setSize(message[0], message[1], "HD");
                if (message[1] == 1080)
                    this.setSize(message[0], message[1], "FHD");
            },
        );
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
                this.selectedSize = message;
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
}
