import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { SliderComponent } from "./slider.component";
import { RosService } from "../shared/ros.service";

describe("SliderComponent", () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;
  let rosService: RosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SliderComponent],
      imports: [ReactiveFormsModule],
      providers: [RosService],
    }).compileComponents();
    rosService = TestBed.inject(RosService);
    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    component.messageReceiver$ = rosService.qualityFactorReceiver$;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change value after receiving a message from RosTopic", () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    const jsonValue = (component.minValue + component.maxValue) / 2;
    component.messageReceiver$.next(jsonValue);
    fixture.detectChanges();
    expect(Number(slider.value)).toBe(jsonValue);
  });

  it("should call sendMessage after changing the slider", fakeAsync(() => {
    component.ngOnInit();
    const spyOnSendMessage = spyOn(component, "sendMessage");
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = String((component.minValue + component.maxValue) / 2);
    slider.dispatchEvent(new Event("input"));
    tick(1000);
    fixture.detectChanges();
    expect(spyOnSendMessage).toHaveBeenCalled();
  }));

  it("should adjust the slider when using textinput on bubble", fakeAsync(() => {
    component.ngOnInit();
    component.ngAfterViewInit();
    const val = String((component.minValue + component.maxValue) / 2);
    component.bubbleFormControl.setValue(val);
    component.bubbleInput = jasmine.createSpyObj(
      "nativeElement",
      {},
      { property: "property" },
    );
    component.bubbleInput.nativeElement = jasmine.createSpyObj(
      "nativeElement",
      { select: "select", focus: "focus" },
    );
    component.toggleInputUnvisible();
    tick(500);
    expect(component.sliderFormControl.value).toBeLessThanOrEqual(
      component.bubbleFormControl.value,
    );
  }));

  it("should set slider values to min or max if given value out of bounds", () => {
    const maxOutOfBounds = 300;
    const minOutOfBounds = -300;
    component.setSliderValue(component.getValueWithinRange(maxOutOfBounds));
    expect(component.sliderFormControl.value).toBeLessThanOrEqual(
      component.maxValue,
    );
    component.setSliderValue(component.getValueWithinRange(minOutOfBounds));
    expect(component.sliderFormControl.value).toBeGreaterThanOrEqual(
      component.minValue,
    );
  });
});
