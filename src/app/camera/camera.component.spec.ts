import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import {
  ReactiveFormsModule,
} from "@angular/forms";
import { CameraComponent } from "./camera.component";
import { RosService } from "../shared/ros.service";
import { By } from "@angular/platform-browser";

describe("CameraComponent", () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let rosService: RosService;
  let spyUnsubscribeCamera: jasmine.Spy<() => void>


  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [CameraComponent],
      imports: [ReactiveFormsModule],
      providers: [RosService],
    }).compileComponents();
    rosService = TestBed.inject(RosService);
    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    spyUnsubscribeCamera = spyOn(rosService,'unsubscribeCameraTopic')

  });


  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a silder step of 0.05", () => {
    const slider = fixture.nativeElement.querySelector("#refreshRate");
    expect(slider.step).toBe("0.05");
  });

  it("should have a maximum range at 1", () => {
    const slider = fixture.nativeElement.querySelector("#refreshRate");
    expect(slider.max).toBe("1");
  });

  it("should have a mininum range at 0.1", () => {
    const slider = fixture.nativeElement.querySelector("#refreshRate");
    expect(slider.min).toBe("0.1");
  });


  it("should subscribe to the message receiver when the component is instantiated", () => {
    const receiver$ = rosService.cameraReceiver$;
    const spy = spyOn(receiver$, 'subscribe')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });

  it("refreh rate should be set to 0.1 when the component is instantiated", () => {
    const spy = spyOn(component, 'setRefrechRate')
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
    const width = 100;
    const height = 200;
    component.setSize(width, height);
    expect(component.selectedSize).toBe(height + 'p');
    expect(component.isLoading).toBeTrue();
    expect(rosService.setPreviewSize).toHaveBeenCalledWith(width, height);
    tick(1500);
    expect(component.isLoading).toBeFalse();
  }));

  it("should call refrechRate() in inputRefrechRate() on input event", fakeAsync(() => {
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component,'inputRefrechRate').and.callThrough();
    spyOn(component,'setRefrechRate');
    const slider = fixture.nativeElement.querySelector("#refreshRate");
    slider.value = 1;
    slider.dispatchEvent(new Event("input"));
    component.inputRefrechRate();
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.setRefrechRate).toHaveBeenCalled();
    expect(component.inputRefrechRate).toHaveBeenCalled();
  }));


  it("should call refrechRate() in inputRefrechRate() on input event", fakeAsync(() => {
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component,'inputQualityFactor').and.callThrough();
    spyOn(component,'setQualityFactor');
    const slider = fixture.nativeElement.querySelector("#qualityFactorSlider");
    slider.value = 50;
    slider.dispatchEvent(new Event("input"));
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.inputQualityFactor).toHaveBeenCalled();
    expect(component.setQualityFactor).toHaveBeenCalled();
  }));


  it("should start the camera when i click on the start camera button", () => {
    const spyStartCamera = spyOn(component, 'startCamera')
    const startBtn = fixture.debugElement.query(By.css("#startCamera"));
    startBtn.nativeElement.click()
    expect(spyStartCamera).toHaveBeenCalled();
  });

  it("startCamera should subscribe to the camera topic", () => {
    const spySubscribe = spyOn(rosService,'subscribeCameraTopic')
    component.startCamera();
    expect(spySubscribe).toHaveBeenCalled();
  });

  it("should stop the camera when i click on the stop camera button", () => {
    const stopBtn = fixture.debugElement.query(By.css("#stopCamera"));
    stopBtn.nativeElement.click()
    expect(spyUnsubscribeCamera).toHaveBeenCalled();
  });


  it("stopCamera should get called when OnDestroy is called", () => {
    component.ngOnDestroy();
    expect(spyUnsubscribeCamera).toHaveBeenCalled();
  });

});
