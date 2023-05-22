import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { SliderComponent } from "../slider/slider.component";

import { HandComponent } from "./hand.component";
import { RosService } from "../shared/ros.service";
import { left } from "@popperjs/core";
import { MotorCurrentMessage } from "../shared/currentMessage";

describe("HandComponent", () => {
  let component: HandComponent;
  let fixture: ComponentFixture<HandComponent>;
  let rosService: RosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HandComponent, SliderComponent],
      imports: [RouterTestingModule, ReactiveFormsModule],
      providers: [RosService],
    }).compileComponents();

    fixture = TestBed.createComponent(HandComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should contain 8 sliders with their own topic", () => {
    component.side = "left";
    fixture.detectChanges();
    const sliders = fixture.debugElement.queryAll(By.css("app-slider"));
    expect(sliders.length).toBe(8);
    for (const slider of sliders) {
      console.log(slider.componentInstance);
      expect(slider.componentInstance.motorName).toBeTruthy();
    }
  });

  it("should call reset() and set all slider values to 0 after clicking reset button", () => {
    component.side = "left";
    fixture.detectChanges();

    const sliders = fixture.debugElement.queryAll(By.css("app-slider"));
    for (const slider of sliders) {
      spyOn(slider.componentInstance, "sendMessage");
    }

    spyOn(component, "reset").and.callThrough();

    const button = fixture.nativeElement.querySelector("#resetButton");
    spyOn(button, "dispatchEvent").and.callThrough();
    for (const c of sliders) {
      c.componentInstance.sliderFormControl.setValue(10);
    }
    button.dispatchEvent(new MouseEvent("click"));
    fixture.detectChanges();
    expect(button.dispatchEvent).toHaveBeenCalledWith(new MouseEvent("click"));
    expect(component.reset).toHaveBeenCalled();

    for (const slider of sliders) {
      const input = slider.children[1].children[2];
      expect(input.nativeElement.value).toBe("0");
      expect(slider.componentInstance.sendMessage).toHaveBeenCalled();
    }
  });

  it("should send value of index finger to all finger topics after switching to 2 sliders", () => {
    component.side = "left";
    component.leftSwitchControl.setValue(true);
    fixture.detectChanges();
    const checkInput = fixture.debugElement.query(By.css(".form-check-input"));
    spyOn(checkInput.componentInstance, "switchView").and.callThrough();
    const sliders = fixture.debugElement.queryAll(By.css("app-slider"));
    sliders
      .filter(
        (slider) =>
          slider.children[1].componentInstance.labelName !== "Thumb Opposition" && slider.children[1].componentInstance.motorName === 'all_right_stretch'
      )
      .forEach((slider) =>
        spyOn(slider.componentInstance, "sendAllMessagesCombined")
      );
    sliders
      .filter(
        (slider) => slider.componentInstance.labelName === "Index finger"
      )[0]
      .componentInstance.sliderFormControl.setValue(500);

    checkInput.nativeElement.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    expect(checkInput.componentInstance.switchView).toHaveBeenCalled();

    component.childComponents
      .filter((child) => child.labelName !== "Thumb opposition" && child.motorName === 'all_right_stretch')
      .forEach((child) => {
        spyOn(child, "sendAllMessagesCombined")
        console.log("slider from control" + child.sliderFormControl.value);
        expect(child.sliderFormControl.value).toBe(500);
        expect(child.sendAllMessagesCombined).toHaveBeenCalled();
      });
  });

  it("should send dummy values", () => {
    component.side = "left";
    fixture.detectChanges();
    const dummyBtnLEft = fixture.debugElement.query(By.css("#dummyBtnLeft"));
    spyOn(rosService, "sendMessage");
    dummyBtnLEft.nativeElement.click();
    expect(rosService.sendMessage).toHaveBeenCalledTimes(5);

    component.side = "right";
    fixture.detectChanges();
    const dummyBtnRight = fixture.debugElement.query(By.css("#dummyBtnRight"));
    dummyBtnRight.nativeElement.click();
    expect(rosService.sendMessage).toHaveBeenCalledTimes(10);
  });
});
