import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {CameraComponent} from "./camera.component";
import {RosService} from "../shared/services/ros-service/ros.service";
import {By} from "@angular/platform-browser";
import {NgbPopover} from "@ng-bootstrap/ng-bootstrap";
import {CameraService} from "../shared/services/camera.service";
import {ApiService} from "../shared/services/api.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {HorizontalSliderComponent} from "../sliders/horizontal-slider/horizontal-slider.component";
import {
    Detection,
    DetectionArray,
} from "../shared/ros-types/msg/detection-array";
import {HAND_KEYPOINT_NAMES} from "./hand-skeleton";

describe("CameraComponent", () => {
    let component: CameraComponent;
    let fixture: ComponentFixture<CameraComponent>;
    let rosService: RosService;
    let spyUnsubscribeCamera: jasmine.Spy<() => void>;
    let cameraService: CameraService;
    const detectionMessage = (
        modelId: string,
        frameWidth = 640,
        frameHeight = 480,
    ): DetectionArray => ({
        model_id: modelId,
        frame_width: frameWidth,
        frame_height: frameHeight,
        detections: [
            {
                label: "hand",
                score: 0.9,
                x_min: 64,
                y_min: 48,
                x_max: 320,
                y_max: 240,
                keypoint_names: ["wrist"],
                keypoint_x: [128],
                keypoint_y: [96],
                keypoint_z: [0],
                scalar_names: [],
                scalar_values: [],
            },
        ],
    });
    const namedHandDetection = (): Detection => ({
        label: "hand",
        score: 0.9,
        x_min: 64,
        y_min: 48,
        x_max: 320,
        y_max: 240,
        keypoint_names: [...HAND_KEYPOINT_NAMES],
        keypoint_x: HAND_KEYPOINT_NAMES.map((_, index) => index),
        keypoint_y: HAND_KEYPOINT_NAMES.map((_, index) => 100 + index),
        keypoint_z: HAND_KEYPOINT_NAMES.map(() => 0),
        scalar_names: [],
        scalar_values: [],
    });
    const unnamedDetection = (count: number): Detection => ({
        label: "face",
        score: 0.9,
        x_min: 10,
        y_min: 10,
        x_max: 100,
        y_max: 100,
        keypoint_names: [],
        keypoint_x: Array.from({length: count}, (_, index) => index),
        keypoint_y: Array.from({length: count}, (_, index) => index),
        keypoint_z: Array.from({length: count}, () => 0),
        scalar_names: [],
        scalar_values: [],
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                NgbPopover,
                HttpClientTestingModule,
                CameraComponent,
                HorizontalSliderComponent,
            ],
            providers: [RosService, CameraService, ApiService],
        }).compileComponents();
        rosService = TestBed.inject(RosService);
        cameraService = TestBed.inject(CameraService);
        fixture = TestBed.createComponent(CameraComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        spyUnsubscribeCamera = spyOn(rosService, "unsubscribeCameraTopic");
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("setSize should send the size message via setPreviewSize method in rosService", fakeAsync(() => {
        spyOn(component, "setSize").and.callThrough();
        spyOn(rosService, "setPreviewSize");
        const width = 1920;
        const height = 1080;
        const resolution = "FHD";
        component.setSize(width, height, resolution);
        expect(component.selectedSize).toBe(height + "px(" + resolution + ")");
        expect(component.isLoading).toBeTrue();
        tick(1500);
        expect(component.isLoading).toBeFalse();
    }));

    it("should toggle the camera when i click on the camera icon", () => {
        const spyStartCamera = spyOn(component, "startCamera");
        const spyStopCamera = spyOn(component, "stopCamera");

        const toggleBtn = fixture.debugElement.query(By.css("#toggleCamera"));
        toggleBtn.nativeElement.click();
        expect(spyStartCamera).toHaveBeenCalled();
        toggleBtn.nativeElement.click();
        expect(spyStopCamera).toHaveBeenCalled();
    });

    it("should display an error image when receiving error messages from the backend", fakeAsync(() => {
        rosService.cameraReceiver$.next("Camera not available");
        tick(1000);
        expect(component.imageSrc).toMatch("../../assets/camera-error-image");
    }));

    it("should change the running state of the camera when clicking camera icon", () => {
        spyOn(rosService, "subscribeCameraTopic");
        spyOn(cameraService, "publishCameraSettings");
        const spyOnToggleCamera = spyOn(
            component,
            "toggleCameraState",
        ).and.callThrough();
        const toggleBtn = fixture.debugElement.query(By.css("#toggleCamera"));
        // Initially isActive is falsy (undefined from empty CameraSettings)
        toggleBtn.nativeElement.click();
        expect(spyOnToggleCamera).toHaveBeenCalledTimes(1);
        expect(component.cameraSettings?.isActive).toBeTrue();
        toggleBtn.nativeElement.click();
        expect(spyOnToggleCamera).toHaveBeenCalledTimes(2);
        expect(component.cameraSettings?.isActive).toBeFalse();
    });

    it("should subscribe to the camera topic during initialization", () => {
        expect(rosService["cameraSubscriptionRequested"]).toBeTrue();
    });

    it("startCamera should subscribe to the camera topic idempotently", () => {
        rosService["initTopicsAndServices"]();
        const spySubscribe = spyOn(
            rosService,
            "subscribeCameraTopic",
        ).and.callThrough();
        const topicSubscribe = spyOn(rosService["cameraTopic"], "subscribe");
        component.startCamera();
        component.startCamera();
        expect(spySubscribe).toHaveBeenCalledTimes(2);
        expect(topicSubscribe).toHaveBeenCalledTimes(1);
        expect(rosService["cameraTopicSubscribed"]).toBeTrue();
    });

    it("should refresh the displayed frame at the configured UI rate", fakeAsync(() => {
        const startModel = spyOn(rosService, "startModel");
        const toggleBtn = fixture.debugElement.query(By.css("#toggleCamera"));

        toggleBtn.nativeElement.click();
        component.updateRefreshRateLabel(0.5);
        rosService.cameraReceiver$.next("frame-one");
        rosService.cameraReceiver$.next("frame-two");

        expect(component.imageSrc).toBe("data:image/jpeg;base64,frame-one");
        tick(499);
        expect(component.imageSrc).toBe("data:image/jpeg;base64,frame-one");
        tick(1);
        expect(component.imageSrc).toBe("data:image/jpeg;base64,frame-two");
        expect(startModel).not.toHaveBeenCalled();
    }));

    it("should retain only the newest pending detection per model", fakeAsync(() => {
        component.updateRefreshRateLabel(0.5);
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        const newest = detectionMessage("hands");
        newest.detections[0].x_min = 123;
        rosService.detectionReceiver$.next(newest);

        tick(499);
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css(".detection-box"))).toBeNull();

        tick(1);
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css(".detection-box")).attributes[
                "x"
            ],
        ).toBe("123");
    }));

    it("should notify zoneless Angular once for each display flush", fakeAsync(() => {
        const markForCheck = spyOn(
            component["changeDetectorRef"],
            "markForCheck",
        );
        component.updateRefreshRateLabel(0.5);

        rosService.cameraReceiver$.next("frame-one");
        rosService.cameraReceiver$.next("frame-two");
        rosService.cameraReceiver$.next("frame-three");
        expect(markForCheck).toHaveBeenCalledTimes(1);

        tick(500);
        expect(markForCheck).toHaveBeenCalledTimes(2);
    }));

    it("stopCamera should get called when OnDestroy is called", () => {
        component.ngOnDestroy();
        expect(spyUnsubscribeCamera).toHaveBeenCalled();
    });

    it("should clear pending display state, overlays, and timers on stop", () => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));

        component.stopCamera();

        expect(component.imageSrc).toBe("../../assets/camera-placeholder.jpg");
        expect(component.visibleDetectionLayers).toEqual([]);
        expect(component["pendingCameraFrame"]).toBeUndefined();
        expect(component["pendingDetections"].size).toBe(0);
        expect(component["displayRefreshTimer"]).toBeUndefined();
        expect(component["detectionExpiryTimers"].size).toBe(0);
        expect(component["diagnosticTimer"]).toBeUndefined();
    });

    it("should render independent overlays using each detection frame size", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands", "objects"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        rosService.detectionReceiver$.next(
            detectionMessage("objects", 1280, 720),
        );
        tick(100);
        fixture.detectChanges();

        const overlays = fixture.debugElement.queryAll(
            By.css(".detection-overlay"),
        );
        expect(overlays.length).toBe(2);
        expect(overlays[0].attributes["viewBox"]).toBe("0 0 640 480");
        expect(overlays[1].attributes["viewBox"]).toBe("0 0 1280 720");
    }));

    it("should draw detection boxes and all 21 hand landmarks", fakeAsync(() => {
        const message = detectionMessage("hands");
        message.detections[0].keypoint_names = Array.from(
            {length: 21},
            (_, index) => `landmark-${index}`,
        );
        message.detections[0].keypoint_x = Array.from(
            {length: 21},
            (_, index) => 100 + index,
        );
        message.detections[0].keypoint_y = Array.from(
            {length: 21},
            (_, index) => 200 + index,
        );
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(message);
        tick(100);
        fixture.detectChanges();

        const box = fixture.debugElement.query(By.css(".detection-box"));
        const landmarks = fixture.debugElement.queryAll(
            By.css(".detection-keypoint"),
        );

        expect(box.attributes["x"]).toBe("64");
        expect(box.attributes["y"]).toBe("48");
        expect(box.attributes["width"]).toBe("256");
        expect(box.attributes["height"]).toBe("192");
        expect(landmarks.length).toBe(21);
        expect(landmarks[20].attributes["cx"]).toBe("120");
        expect(landmarks[20].attributes["cy"]).toBe("220");
    }));

    it("should return 21 connections for a named MediaPipe hand", () => {
        const detection = namedHandDetection();
        const connections = component.connections(detection);

        expect(connections.length).toBe(21);
        expect(connections[0]).toEqual({
            x1: 0,
            y1: 100,
            x2: 1,
            y2: 101,
        });
        expect(connections[20]).toEqual({
            x1: 0,
            y1: 100,
            x2: 17,
            y2: 117,
        });
    });

    it("should return no connections for a face-style detection with 5 unnamed keypoints", () => {
        const detection = unnamedDetection(5);
        expect(component.connections(detection)).toEqual([]);
    });

    it("should omit segments whose endpoints are not finite", () => {
        const detection = namedHandDetection();
        detection.keypoint_x[4] = Number.NaN;
        detection.keypoint_y[8] = Number.POSITIVE_INFINITY;

        const connections = component.connections(detection);

        expect(connections.length).toBe(19);
        expect(
            connections.some(
                (connection) =>
                    (connection.x1 === 3 && connection.x2 === 4) ||
                    (connection.x1 === 4 && connection.x2 === 3),
            ),
        ).toBeFalse();
        expect(
            connections.some(
                (connection) =>
                    (connection.x1 === 7 && connection.x2 === 8) ||
                    (connection.x1 === 8 && connection.x2 === 7),
            ),
        ).toBeFalse();
    });

    it("should place the model list beside the camera image", () => {
        const workspaceElement = fixture.debugElement.query(
            By.css(".camera-workspace"),
        ).nativeElement as HTMLElement;
        const modelList = fixture.debugElement.query(
            By.css("#cameraColumn + .model-column app-model-list"),
        );

        expect(modelList).not.toBeNull();
        expect(getComputedStyle(workspaceElement).display).toBe("grid");
        expect(getComputedStyle(workspaceElement).gridTemplateColumns).not.toBe(
            "none",
        );
    });

    it("should clear stale detections when messages stop", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        tick(100);
        fixture.detectChanges();
        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(1);

        tick(1500);
        fixture.detectChanges();
        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(0);
    }));

    it("should clear overlays immediately while the pipeline restarts", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        tick(100);
        fixture.detectChanges();

        rosService.detectionClearReceiver$.next(undefined);
        fixture.detectChanges();

        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(0);

        rosService.detectionReceiver$.next(detectionMessage("hands"));
        tick(100);
        fixture.detectChanges();
        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(1);
    }));

    it("should keep overlays while detection messages continue", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));

        tick(100);
        tick(1000);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        tick(1000);
        fixture.detectChanges();

        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(1);
    }));

    it("should show recent message counts and rosbridge state", () => {
        rosService.cameraReceiver$.next("frame-one");
        rosService.cameraReceiver$.next("frame-two");
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        fixture.detectChanges();

        const diagnostic = fixture.debugElement.query(
            By.css(".camera-diagnostic"),
        ).nativeElement as HTMLElement;

        expect(diagnostic.textContent).toContain("2 frames");
        expect(diagnostic.textContent).toContain("1 detections");
        expect(diagnostic.textContent).toContain("rosbridge disconnected");
    });
});
