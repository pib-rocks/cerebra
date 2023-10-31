import {TestBed} from "@angular/core/testing";

import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ApiService} from "./api.service";
import {CameraService} from "./camera.service";
import {CameraSetting} from "../types/camera-settings";
import {BehaviorSubject, Observable} from "rxjs";
import {RosService} from "../ros.service";
import {HttpClient} from "@angular/common/http";

describe("CameraService", () => {
    let service: CameraService;
    // let spyOnCameraSettings: jasmine.Spy<() => void>;
    let apiService: ApiService;
    let rosService: RosService;

    const updateCameraSettings = new CameraSetting(
        "HD",
        0.5,
        50,
        false,
        1280,
        720,
    );
    const cameraSettings = new CameraSetting("SD", 0.1, 80, false, 640, 480);
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
        expect(service.qualityFactor).toBe(80);
        expect(service.timerPeriod).toBe(0.1);
        expect(service.resX).toBe(640);
        expect(service.resY).toBe(480);
    });

    it("should retrun updated camera settings", () => {
        const spyOnPutCameraSettings = spyOn(apiService, "put").and.returnValue(
            behaviorSubjectOfUpdatedCameraSettings,
        );
        service.updateCameraSettings(updateCameraSettings);
        expect(spyOnPutCameraSettings).toHaveBeenCalled();
        expect(service.resX).toBe(1280);
        expect(service.resY).toBe(720);
        expect(service.qualityFactor).toBe(50);
        expect(service.timerPeriod).toBe(0.5);
    });

    it("should retrun the saved Camera Settings", () => {
        const spyOnPutCameraSettings = spyOn(apiService, "put").and.returnValue(
            behaviorSubjectOfUpdatedCameraSettings,
        );
        service.saveCameraSettings();
        expect(spyOnPutCameraSettings).toHaveBeenCalled();
        expect(service.resX).toBe(1280);
        expect(service.resY).toBe(720);
        expect(service.qualityFactor).toBe(50);
        expect(service.timerPeriod).toBe(0.5);
    });

    it("should return camera quality factor over ros topic", () => {
        service.subscribeCameraQualityFactorReceiver();
        rosService.cameraQualityFactorReceiver$.next(40);
        expect(service.qualityFactorSubject.getValue()).toBe(40);
    });

    it("should return camera preview size over ros topic", () => {
        service.subscribeCameraPreviewSizeReceiver();
        rosService.cameraPreviewSizeReceiver$.next([620, 480]);
        expect(service.cameraResXSubject.getValue()).toBe(620);
        expect(service.cameraResYSubject.getValue()).toBe(480);
    });

    it("should return camera preview size over ros topic", () => {
        service.subscribeCameraTimerPeriodReceiver();
        rosService.cameraTimerPeriodReceiver$.next(0.5);
        expect(service.cameraTimerPeriodSubject.getValue()).toBe(0.5);
    });

    it("should return camera preview size over ros topic", () => {
        service.subscribeCameraReseiver();
        let res: string;
        service.cameraReciver$.subscribe((response) => {
            res = response;
        });
        rosService.cameraReceiver$.next("TestString");
        expect(res!).toBe("TestString");
    });
    //Ros Services methoden ebenfalls testen
});
