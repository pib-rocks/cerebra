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

describe("CameraComponent", () => {
    let component: CameraComponent;
    let fixture: ComponentFixture<CameraComponent>;
    let rosService: RosService;
    let spyUnsubscribeCamera: jasmine.Spy<() => void>;
    let videoSettingsButton: HTMLButtonElement;
    let cameraService: CameraService;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            declarations: [CameraComponent, HorizontalSliderComponent],
            imports: [ReactiveFormsModule, NgbPopover, HttpClientTestingModule],
            providers: [RosService, CameraService, ApiService],
        }).compileComponents();
        rosService = TestBed.inject(RosService);
        cameraService = TestBed.inject(CameraService);
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
});
