import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { CameraComponent } from "./camera.component";
import { RosService } from "../shared/ros.service";
import { By } from "@angular/platform-browser";
import { SliderComponent } from "../slider/slider.component";
import { NgbPopover } from "@ng-bootstrap/ng-bootstrap";


describe("CameraComponent", () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let rosService: RosService;
  let spyUnsubscribeCamera: jasmine.Spy<() => void>
  let videoSettingsButton : HTMLButtonElement;

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
    spyUnsubscribeCamera = spyOn(rosService,'unsubscribeCameraTopic')
    videoSettingsButton = fixture.nativeElement.querySelector("#videosettings");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a silder step of 0.05", () => {
    videoSettingsButton.click();
    const slider = fixture.nativeElement.querySelector("#slider_refreshRate");
    expect(slider.step).toBe("0.05");
  });

  it("should have a maximum range at 1", () => {
    videoSettingsButton.click();
    const slider = fixture.nativeElement.querySelector("#slider_refreshRate");
    expect(slider.max).toBe("1");
  });

  it("should have a mininum range at 0.1", () => {
    videoSettingsButton.click();
    const slider = fixture.nativeElement.querySelector("#slider_refreshRate");
    expect(slider.min).toBe("0.1");
  });

  it("should subscribe to the message receiver when the component is instantiated", () => {
    const receiver$ = rosService.cameraReceiver$;
    const spy = spyOn(receiver$, 'subscribe')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });

  it("refresh rate should be set to 0.5 when the component is instantiated", () => {
    const spy = spyOn(component, 'setRefreshRate')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });

  it("size should be set to 480p when the component is instantiated", () => {
    const spy = spyOn(rosService, 'setPreviewSize')
    component.ngOnInit()
    expect(spy).toHaveBeenCalledWith(640, 480);
  });

  it("setsize should send the size message via setPreviewSize method in rosService",fakeAsync ( () => {
    spyOn(component,'setSize').and.callThrough();
    spyOn(rosService,'setPreviewSize');
    const width = 640;
    const height = 480;
    const resolution = 'SD'
    component.setSize(width, height);
    expect(component.selectedSize).toBe(height + 'p' + ' ' + '(' + resolution + ')');
    expect(component.isLoading).toBeTrue();
    expect(rosService.setPreviewSize).toHaveBeenCalledWith(width, height);
    tick(1500);
    expect(component.isLoading).toBeFalse();
  }));

  it("should call refreshRate() in inputRefreshRate() when setting new on slider_refreshRate", fakeAsync(() => {
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component,'inputRefreshRate').and.callThrough();
    spyOn(component,'setRefreshRate');
    videoSettingsButton.click();
    const slider = fixture.nativeElement.querySelector("#slider_refreshRate");
    slider.value = 0.9;
    slider.dispatchEvent(new Event("input"));
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.setRefreshRate).toHaveBeenCalled();
    expect(component.inputRefreshRate).toHaveBeenCalled();
  }));

  it("should call setQualityFactor() in inputQualityFactor() when setting new on slider_qualityFactor", fakeAsync(() => {
    videoSettingsButton.click();
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component,'inputQualityFactor').and.callThrough();
    spyOn(component,'setQualityFactor');
    const slider = fixture.nativeElement.querySelector('#slider_qualityFactor');
    slider.value = 30;
    slider.dispatchEvent(new Event("input"));
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.inputQualityFactor).toHaveBeenCalled();
    tick(1000);
    expect(component.setQualityFactor).toHaveBeenCalled();

  }));

  it("should toggle the camera when i click on the camera icon", () => {
    const spyStartCamera = spyOn(component, 'startCamera');
    const spyStopCamera = spyOn(component, 'stopCamera');
    const toggleBtn = fixture.debugElement.query(By.css("#toggleCamera"));
    toggleBtn.nativeElement.click()
    expect(spyStartCamera).toHaveBeenCalled();
    toggleBtn.nativeElement.click()
    expect(spyStopCamera).toHaveBeenCalled();
  });

  it("startCamera should subscribe to the camera topic", () => {
    const spySubscribe = spyOn(rosService,'subscribeCameraTopic')
    component.startCamera();
    expect(spySubscribe).toHaveBeenCalled();
  });

  it("stopCamera should get called when OnDestroy is called", () => {
    component.ngOnDestroy();
    expect(spyUnsubscribeCamera).toHaveBeenCalled();
  });

});
