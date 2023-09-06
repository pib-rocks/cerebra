import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {CameraComponent} from "./camera.component";
import {RosService} from "../shared/ros.service";
import {By} from "@angular/platform-browser";
import {SliderComponent} from "../slider/slider.component";
import {NgbPopover} from "@ng-bootstrap/ng-bootstrap";

describe("CameraComponent", () => {
    let component: CameraComponent;
    let fixture: ComponentFixture<CameraComponent>;
    let rosService: RosService;
    let spyUnsubscribeCamera: jasmine.Spy<() => void>;
    let videoSettingsButton: HTMLButtonElement;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            declarations: [CameraComponent, SliderComponent],
            imports: [ReactiveFormsModule, NgbPopover],
            providers: [RosService],
        }).compileComponents();
        rosService = TestBed.inject(RosService);
        fixture = TestBed.createComponent(CameraComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        spyUnsubscribeCamera = spyOn(rosService, "unsubscribeCameraTopic");
        videoSettingsButton =
            fixture.nativeElement.querySelector("#videosettings");
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should have a silder step of 0.1", () => {
        videoSettingsButton.click();
        const slider = fixture.nativeElement.querySelector(
            "#slider_refreshRate",
        );
        expect(slider.step).toBe("0.1");
    });

    it("should have a maximum range at 1", () => {
        videoSettingsButton.click();
        const slider = fixture.nativeElement.querySelector(
            "#slider_refreshRate",
        );
        expect(slider.max).toBe("1");
    });

    it("should have a minimum range at 0.1", () => {
        videoSettingsButton.click();
        const slider = fixture.nativeElement.querySelector(
            "#slider_refreshRate",
        );
        expect(slider.min).toBe("0.1");
    });

    it("should subscribe to the message receiver when the component is instantiated", () => {
        const receiver$ = rosService.cameraReceiver$;
        const spy = spyOn(receiver$, "subscribe");
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it("size should be set to the value of the behaviourSubject when the component is instantiated", () => {
        const spy = spyOn(component, "setSize");
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it("setsize should send the size message via setPreviewSize method in rosService", fakeAsync(() => {
        spyOn(component, "setSize").and.callThrough();
        spyOn(rosService, "setPreviewSize");
        const width = 1920;
        const height = 1080;
        const resolution = "FHD";
        component.setSize(width, height);
        expect(component.selectedSize).toBe(
            height + "p" + " " + "(" + resolution + ")",
        );
        expect(component.isLoading).toBeTrue();
        expect(rosService.setPreviewSize).toHaveBeenCalledWith(width, height);
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
        const spyOnToggleCamera = spyOn(component, "toggleCameraState");
        const toggleBtn = fixture.debugElement.query(By.css("#toggleCamera"));
        const cameraActiveState = component.isCameraActive;
        toggleBtn.nativeElement.click();
        expect(spyOnToggleCamera).toHaveBeenCalled();
        fixture.detectChanges();
        expect(cameraActiveState).toBeTrue;
        toggleBtn.nativeElement.click();
        expect(spyOnToggleCamera).toHaveBeenCalled();
        fixture.detectChanges();
        expect(cameraActiveState).toBeFalse;
    });

    it("startCamera should subscribe to the camera topic", () => {
        const spySubscribe = spyOn(rosService, "subscribeCameraTopic");
        component.startCamera();
        expect(spySubscribe).toHaveBeenCalled();
    });

    it("stopCamera should get called when OnDestroy is called", () => {
        component.ngOnDestroy();
        expect(spyUnsubscribeCamera).toHaveBeenCalled();
    });
});
