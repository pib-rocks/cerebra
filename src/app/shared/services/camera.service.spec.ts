import {TestBed} from "@angular/core/testing";

import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ApiService} from "./api.service";
import {CameraService} from "./camera.service";
import {CameraSetting} from "../types/camera-settings";
import {BehaviorSubject} from "rxjs";
import {RosService} from "../ros.service";
import {HttpClient} from "@angular/common/http";

describe("CameraService", () => {
    let service: CameraService;
    let apiService: ApiService;
    let rosService: RosService;

    const updateCameraSettings = new CameraSetting("HD", 0.5, 50, 1280, 720);
    const cameraSettings = new CameraSetting("SD", 0.1, 80, 640, 480);
    const behaviorSubjectOfCameraSettings = new BehaviorSubject<any>(
        cameraSettings,
    );
    const behaviorSubjectOfUpdatedCameraSettings = new BehaviorSubject<any>(
        updateCameraSettings,
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CameraService, ApiService, HttpClient, RosService],
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CameraService);
        apiService = TestBed.inject(ApiService);
        rosService = TestBed.inject(RosService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should return camera settings", () => {
        const spyOnGetCameraSettings = spyOn(apiService, "get").and.returnValue(
            behaviorSubjectOfCameraSettings,
        );
        service.getCameraSettings();
        expect(spyOnGetCameraSettings).toHaveBeenCalled();
        expect(service.cameraSettings.getValue()).toEqual(cameraSettings);
    });

    it("should retrun updated camera settings", () => {
        const spyOnPutCameraSettings = spyOn(apiService, "put").and.returnValue(
            behaviorSubjectOfUpdatedCameraSettings,
        );
        service.publishCameraSettings(updateCameraSettings);
        expect(spyOnPutCameraSettings).toHaveBeenCalled();
        expect(service.cameraSettings.getValue()).toEqual(updateCameraSettings);
    });

    it("should return camera quality factor over ros topic", () => {
        service.cameraSettings.next(updateCameraSettings);
        service.subscribeCameraQualityFactorReceiver();
        rosService.cameraQualityFactorReceiver$.next(40);
        expect(service.cameraSettings.getValue().qualityFactor).toBe(40);
    });

    it("should return camera preview size over ros topic", () => {
        service.cameraSettings.next(updateCameraSettings);
        service.subscribeCameraPreviewSizeReceiver();
        rosService.cameraPreviewSizeReceiver$.next([620, 480]);
        expect(service.cameraSettings.getValue().resX).toBe(620);
        expect(service.cameraSettings.getValue().resY).toBe(480);
    });

    it("should return camera refreshRate over ros topic", () => {
        service.cameraSettings.next(updateCameraSettings);
        service.subscribeCameraTimerPeriodReceiver();
        rosService.cameraTimerPeriodReceiver$.next(0.5);
        expect(service.cameraSettings.getValue().refreshRate).toBe(0.5);
    });

    it("should return camera imageString over ros topic", () => {
        service.subscribeCameraReseiver();
        let res: string | undefined;
        service.cameraReciver$.subscribe((response) => {
            res = response;
        });
        rosService.cameraReceiver$.next("TestString");
        expect(res).toBe("TestString");
    });
});
