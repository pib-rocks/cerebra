import {CameraSetting} from "../types/camera-settings";
import {ApiService} from "./api.service";
import {RosService} from "../ros.service";
import {UrlConstants} from "../../shared/services/url.constants";
import {BehaviorSubject, Subject, catchError, throwError} from "rxjs";
import {Injectable} from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class CameraService {
    qualityFactor!: number;
    previewSize!: number[];
    timerPeriod!: number;

    constructor(
        private rosService: RosService,
        private apiService: ApiService,
    ) {
        this.getCameraSettings();
        this.subscribeCameraQualityFactorReceiver();
        this.subscribeCameraPreviewSizeReceiver();
        this.subscribeCameraReseiver();
    }

    camera: CameraSetting | undefined;
    qualityFactorSubject: BehaviorSubject<number> = new BehaviorSubject<number>(
        0,
    );
    cameraPreviewSizeSubject: BehaviorSubject<number[]> = new BehaviorSubject<
        number[]
    >([640, 480]);
    cameraTimerPeriodSubject: BehaviorSubject<number> =
        new BehaviorSubject<number>(0);
    cameraResolutinSubject: BehaviorSubject<string> =
        new BehaviorSubject<string>("");
    cameraIsActiveSubject: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);
    cameraReciver$: Subject<string> = new Subject<string>();

    rosCameraQualityFactorReceiver =
        this.rosService.cameraQualityFactorReceiver$;
    rosCameraTimerPeriodReceiver = this.rosService.cameraTimerPeriodReceiver$;

    updateCameraSettings(updateCameraSetting: CameraSetting) {
        this.apiService
            .put(UrlConstants.CAMERA, updateCameraSetting)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                console.log("save");
            });
    }

    getCameraSettings() {
        this.apiService
            .get(UrlConstants.CAMERA)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.qualityFactorSubject.next(response.qualityFactor);
                this.qualityFactor = response.qualityFactor;
                this.cameraPreviewSizeSubject.next(
                    this.getCameraPreviewSize(response.resolution),
                );
                this.previewSize = this.getCameraPreviewSize(
                    response.resolution,
                );
                this.cameraTimerPeriodSubject.next(response.refreshRate);
                this.timerPeriod = response.refreshRate;
                this.cameraResolutinSubject.next(response.resolution);
                this.cameraIsActiveSubject.next(response.isActive);
            });
    }

    saveCameraSettings() {
        let cameraSettings = new CameraSetting(
            this.cameraResolutinSubject.getValue(),
            this.timerPeriod,
            this.qualityFactor,
            this.cameraIsActiveSubject.getValue(),
        );
        this.updateCameraSettings(cameraSettings);
    }

    subscribeCameraQualityFactorReceiver() {
        this.rosService.cameraQualityFactorReceiver$.subscribe(
            (message: number) => {
                if (this.qualityFactor != message) {
                    this.qualityFactorSubject.next(message);
                    this.qualityFactor = message;
                }
            },
        );
    }

    subscribeCameraPreviewSizeReceiver() {
        this.rosService.cameraPreviewSizeReceiver$.subscribe(
            (message: number[]) => {
                if (
                    message[0] != this.previewSize[0] &&
                    message[1] != this.previewSize[1]
                ) {
                    this.cameraPreviewSizeSubject.next(message);
                    this.previewSize = message;
                }
            },
        );
    }

    subscribeCameraTimerPeriodReceiver() {
        this.rosService.cameraTimerPeriodReceiver$.subscribe(
            (message: number) => {
                if (this.timerPeriod != message) {
                    this.cameraTimerPeriodSubject.next(message);
                    this.timerPeriod = message;
                }
            },
        );
    }

    subscribeCameraReseiver() {
        this.rosService.cameraReceiver$.subscribe((message: string) => {
            this.cameraReciver$.next(message);
        });
    }

    qualityControlPublish(formControlValue: number) {
        this.rosService.setQualityFactor(formControlValue);
    }

    refreshRatePublish = (formControlValue: number) => {
        this.rosService.setTimerPeriod(formControlValue);
    };

    setPreviewSize(width: number, height: number) {
        this.rosService.setPreviewSize(width, height);
    }

    startCamera() {
        this.rosService.subscribeCameraTopic();
    }

    stopCamera() {
        this.rosService.unsubscribeCameraTopic();
    }

    getCameraPreviewSize(resolution: string): number[] {
        if (resolution == "720p (HD)") return [1280, 720];
        else if (resolution == "1080p (FHD)") return [1920, 1080];

        return [640, 480];
    }
}
