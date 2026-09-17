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
import {DetectionArray} from "../shared/ros-types/msg/detection-array";

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

    beforeEach(async () => {
        TestBed.configureTestingModule({
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

    it("startCamera should subscribe to the camera topic", () => {
        const spySubscribe = spyOn(rosService, "subscribeCameraTopic");
        component.startCamera();
        expect(spySubscribe).toHaveBeenCalled();
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

    it("stopCamera should get called when OnDestroy is called", () => {
        component.ngOnDestroy();
        expect(spyUnsubscribeCamera).toHaveBeenCalled();
    });

    it("should render independent overlays using each detection frame size", () => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands", "objects"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        rosService.detectionReceiver$.next(
            detectionMessage("objects", 1280, 720),
        );
        fixture.detectChanges();

        const overlays = fixture.debugElement.queryAll(
            By.css(".detection-overlay"),
        );
        expect(overlays.length).toBe(2);
        expect(overlays[0].attributes["viewBox"]).toBe("0 0 640 480");
        expect(overlays[1].attributes["viewBox"]).toBe("0 0 1280 720");
    });

    it("should draw detection boxes and landmarks", () => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        fixture.detectChanges();

        const box = fixture.debugElement.query(By.css(".detection-box"));
        const landmark = fixture.debugElement.query(
            By.css(".detection-keypoint"),
        );

        expect(box.attributes["x"]).toBe("64");
        expect(box.attributes["y"]).toBe("48");
        expect(box.attributes["width"]).toBe("256");
        expect(box.attributes["height"]).toBe("192");
        expect(landmark.attributes["cx"]).toBe("128");
        expect(landmark.attributes["cy"]).toBe("96");
    });

    it("should place the model list beside the camera image", () => {
        const workspace = fixture.debugElement.query(
            By.css("#cameraColumn + .model-column app-model-list"),
        );

        expect(workspace).not.toBeNull();
    });

    it("should clear stale detections when messages stop", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
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

    it("should clear overlays immediately while the pipeline restarts", () => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));
        fixture.detectChanges();

        rosService.detectionClearReceiver$.next(undefined);
        fixture.detectChanges();

        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(0);

        rosService.detectionReceiver$.next(detectionMessage("hands"));
        fixture.detectChanges();
        expect(
            fixture.debugElement.queryAll(By.css(".detection-overlay")).length,
        ).toBe(1);
    });

    it("should keep overlays while detection messages continue", fakeAsync(() => {
        rosService.cameraReceiver$.next("camera-image");
        rosService.detectionModelsReceiver$.next(["hands"]);
        rosService.detectionReceiver$.next(detectionMessage("hands"));

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
