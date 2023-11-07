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
    resX!: number;
    resY!: number;
    timerPeriod!: number;

    constructor(
        private rosService: RosService,
        private apiService: ApiService,
    ) {
        this.getCameraSettings();
        this.subscribeCameraQualityFactorReceiver();
        this.subscribeCameraPreviewSizeReceiver();
        this.subscribeCameraTimerPeriodReceiver();
        this.subscribeCameraReseiver();
    }
    rosCameraQualityFactorReceiver =
        this.rosService.cameraQualityFactorReceiver$;
    rosCameraTimerPeriodReceiver = this.rosService.cameraTimerPeriodReceiver$;
    cameraReciver$: Subject<string> = new Subject<string>();
    cameraSettings: BehaviorSubject<CameraSetting> =
        new BehaviorSubject<CameraSetting>({} as CameraSetting);

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
                return;
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
                this.cameraSettings.next(response);
            });
    }

    subscribeCameraQualityFactorReceiver() {
        this.rosService.cameraQualityFactorReceiver$.subscribe(
            (message: number) => {
                if (
                    this.cameraSettings.getValue().qualityFactor != message &&
                    this.cameraSettings.getValue().qualityFactor != undefined
                ) {
                    this.cameraSettings.getValue().qualityFactor = message;
                    this.publishCameraSettings(this.cameraSettings.getValue());
                }
            },
        );
    }

    subscribeCameraPreviewSizeReceiver() {
        this.rosService.cameraPreviewSizeReceiver$.subscribe(
            (message: number[]) => {
                if (
                    message[0] != this.cameraSettings.getValue().resX &&
                    message[1] != this.cameraSettings.getValue().resY &&
                    message[0] != 0 &&
                    message[1] != 0 &&
                    this.cameraSettings.getValue().resX != undefined &&
                    this.cameraSettings.getValue().resY != undefined
                ) {
                    this.cameraSettings.getValue().resX = message[0];
                    this.cameraSettings.getValue().resY = message[1];
                    this.publishCameraSettings(this.cameraSettings.getValue());
                }
            },
        );
    }

    subscribeCameraTimerPeriodReceiver() {
        this.rosService.cameraTimerPeriodReceiver$.subscribe(
            (message: number) => {
                if (
                    this.cameraSettings.getValue().refreshRate != message &&
                    this.cameraSettings.getValue().refreshRate != undefined
                ) {
                    this.cameraSettings.getValue().refreshRate = message;
                    this.publishCameraSettings(this.cameraSettings.getValue());
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
        this.cameraSettings.getValue().qualityFactor = formControlValue;
        this.rosService.setQualityFactor(formControlValue);
        this.publishCameraSettings(this.cameraSettings.getValue());
    }

    refreshRatePublish = (formControlValue: number) => {
        this.cameraSettings.getValue().refreshRate = formControlValue;
        this.rosService.setTimerPeriod(formControlValue);
        this.publishCameraSettings(this.cameraSettings.getValue());
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

    publishCameraSettings(cameraSettings: CameraSetting) {
        this.cameraSettings.next(cameraSettings);
        this.updateCameraSettings(cameraSettings);
    }
}
