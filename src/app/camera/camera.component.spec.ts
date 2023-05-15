import {
  ComponentFixture,
  TestBed,
} from "@angular/core/testing";
import {
  FormControl,
  ReactiveFormsModule,
} from "@angular/forms";
import { CameraComponent } from "./camera.component";
import { RosService } from "../shared/ros.service";
import { By } from "@angular/platform-browser";

describe("CameraComponent", () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let formControl: FormControl;
  let rosService: RosService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [CameraComponent],
      imports: [ReactiveFormsModule],
      providers: [RosService],
    }).compileComponents();
    rosService = TestBed.inject(RosService);
    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    formControl = component.refreshRateControl;
    fixture.detectChanges();
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
    const spy = spyOn(receiver$,'subscribe')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });

  it("refreh rate should be set to 0.1 when the component is instantiated", () => {
    const spy = spyOn(component,'refrechRate')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });

  it("size should be set to 480p when the component is instantiated", () => {
    const spy = spyOn(component,'setSize')
    component.ngOnInit()
    expect(spy).toHaveBeenCalled();
  });
  
  it("should call refrechRate() in inputRefrechRate() on input event", () => {
    const spyInput = spyOn(component, "inputRefrechRate").and.callThrough();
    const spyRefrechRate = spyOn(component, "refrechRate");
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = 1;
    slider.dispatchEvent(new Event("input"));
    setTimeout(() => {
      expect(spyInput).toHaveBeenCalled();
      expect(spyRefrechRate).toHaveBeenCalled();
    }, 600);
  });

  it("should start the camera when i click on the start camera button", () => {
    const spy = spyOn(component,'startCamera')
    const startBtn = fixture.debugElement.query(By.css("#startCamera"));
    startBtn.nativeElement.click()
    expect(spy).toHaveBeenCalled()
  });

  it("should stop the camera when i click on the stop camera button", () => {
    const spy = spyOn(component,'stopCamera')
    const stopBtn = fixture.debugElement.query(By.css("#stopCamera"));
    stopBtn.nativeElement.click()
    expect(spy).toHaveBeenCalled()
  });

});
