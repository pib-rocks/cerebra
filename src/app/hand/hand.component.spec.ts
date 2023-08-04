import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { MotorControlComponent } from "../motor-control/motor-control.component";

import { HandComponent } from "./hand.component";
import { RosService } from "../shared/ros.service";
import { NavBarComponent } from "../nav-bar/nav-bar.component";

describe("HandComponent", () => {
  let component: HandComponent;
  let fixture: ComponentFixture<HandComponent>;
  let rosService: RosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HandComponent, MotorControlComponent, NavBarComponent],
      imports: [RouterTestingModule, ReactiveFormsModule],
      providers: [RosService],
    }).compileComponents();

    fixture = TestBed.createComponent(HandComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call reset() and set all slider values to 0 after clicking reset button (left and individul fingers)", () => {
    component.side = "left";

    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));

    spyOn(component, "reset").and.callThrough();

    const button = fixture.nativeElement.querySelector("#home-position-btn");
    spyOn(button, "dispatchEvent").and.callThrough();
    component.leftSwitchControl.setValue(true);
    component.rightSwitchControl.setValue(false);
    sliders
      .filter((child) => !child.componentInstance.motorName.includes("all"))
      .forEach((child) => {
        spyOn(child.componentInstance, "sendMessage");
      });
    fixture.detectChanges();

    sliders
      .filter((child) => !child.componentInstance.motorName.includes("all"))
      .forEach((child) => {
        expect(
          child.componentInstance.sendAllMessagesCombined,
        ).toHaveBeenCalled();
      });
  });

  it("should call reset() and set all slider values to 0 after clicking reset button (right and individul fingers)", () => {
    component.side = "right";

    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));

    spyOn(component, "reset").and.callThrough();

    const button = fixture.nativeElement.querySelector("#home-position-btn");
    spyOn(button, "dispatchEvent").and.callThrough();
    component.leftSwitchControl.setValue(false);
    component.rightSwitchControl.setValue(true);
    sliders
      .filter((child) => !child.componentInstance.motorName.includes("all"))
      .forEach((child) => {
        spyOn(child.componentInstance, "sendMessage");
      });
    fixture.detectChanges();

    sliders
      .filter((child) => !child.componentInstance.motorName.includes("all"))
      .forEach((child) => {
        expect(
          child.componentInstance.sendAllMessagesCombined,
        ).toHaveBeenCalled();
      });
  });

  it("should call reset() and set all slider values to 0 after clicking reset button (right and combained fingers)", () => {
    component.side = "right";

    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));

    spyOn(component, "reset").and.callThrough();

    const button = fixture.nativeElement.querySelector("#home-position-btn");
    spyOn(button, "dispatchEvent").and.callThrough();
    component.leftSwitchControl.setValue(false);
    component.rightSwitchControl.setValue(false);
    sliders
      .filter(
        (child) =>
          child.componentInstance.motorName.includes("all") ||
          child.componentInstance.motorName.includes("opposition"),
      )
      .forEach((child) => {
        spyOn(child.componentInstance, "sendMessage");
      });
    fixture.detectChanges();

    sliders
      .filter(
        (child) =>
          child.componentInstance.motorName.includes("all") ||
          child.componentInstance.motorName.includes("opposition"),
      )
      .forEach((child) => {
        expect(
          child.componentInstance.sendAllMessagesCombined,
        ).toHaveBeenCalled();
      });
  });

  it("should call reset() and set all slider values to 0 after clicking reset button (left and combained fingers)", () => {
    component.side = "left";

    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));

    spyOn(component, "reset").and.callThrough();

    const button = fixture.nativeElement.querySelector("#home-position-btn");
    spyOn(button, "dispatchEvent").and.callThrough();
    component.leftSwitchControl.setValue(false);
    component.rightSwitchControl.setValue(false);
    sliders
      .filter(
        (child) =>
          child.componentInstance.motorName.includes("all") ||
          child.componentInstance.motorName.includes("opposition"),
      )
      .forEach((child) => {
        spyOn(child.componentInstance, "sendMessage");
      });
    fixture.detectChanges();

    sliders
      .filter(
        (child) =>
          child.componentInstance.motorName.includes("all") ||
          child.componentInstance.motorName.includes("opposition"),
      )
      .forEach((child) => {
        expect(
          child.componentInstance.sendAllMessagesCombined,
        ).toHaveBeenCalled();
      });
  });

  // Bugticket: Erst bug fixen dann test reintegrieren
  // it("should send value of index finger to all finger topics after switching to 2 sliders (left)", () => {
  //   component.side = "left";
  //   component.leftSwitchControl.setValue(true);
  //   fixture.detectChanges();
  //   const checkInput = fixture.debugElement.query(By.css(".custom-control-input"));
  //   spyOn(checkInput.componentInstance, "switchView").and.callThrough();
  //   const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));
  //   sliders
  //     .filter(
  //       (slider) =>
  //         slider.children[1].componentInstance.labelName !== "Thumb Opposition" && slider.children[1].componentInstance.motorName === 'all_left_stretch'
  //     )
  //     .forEach((slider) =>
  //       spyOn(slider.componentInstance, "sendAllMessagesCombined")
  //     );
  //   sliders
  //     .filter(
  //       (slider) => slider.componentInstance.labelName === "Index finger"
  //     )[0]
  //     .componentInstance.sliderFormControl.setValue(500);

  //   checkInput.nativeElement.dispatchEvent(new Event("input"));
  //   fixture.detectChanges();
  //   expect(checkInput.componentInstance.switchView).toHaveBeenCalled();

  //   component.childComponents
  //     .filter((child) => child.labelName !== "Thumb opposition" && child.motorName === 'all_left_stretch')
  //     .forEach((child) => {
  //       console.log("slider from control" + child.sliderFormControl.value);
  //       expect(child.sliderFormControl.value).toBe(500);
  //       expect(child.sendAllMessagesCombined).toHaveBeenCalled();
  //     });
  // });

  // it("should send value of index finger to all finger topics after switching to 2 sliders (right)", () => {
  //   component.side = "right";
  //   component.rightSwitchControl.setValue(true);
  //   fixture.detectChanges();
  //   const checkInput = fixture.debugElement.query(By.css(".custom-control-input"));
  //   spyOn(checkInput.componentInstance, "switchView").and.callThrough();
  //   const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));
  //   sliders
  //     .filter(
  //       (slider) =>
  //         slider.children[1].componentInstance.labelName !== "Thumb Opposition" && slider.children[1].componentInstance.motorName === 'all_right_stretch'
  //     )
  //     .forEach((slider) =>
  //       spyOn(slider.componentInstance, "sendAllMessagesCombined")
  //     );
  //   sliders
  //     .filter(
  //       (slider) => slider.componentInstance.labelName === "Index finger"
  //     )[0]
  //     .componentInstance.sliderFormControl.setValue(500);

  //   checkInput.nativeElement.dispatchEvent(new Event("input"));
  //   fixture.detectChanges();
  //   expect(checkInput.componentInstance.switchView).toHaveBeenCalled();

  //   component.childComponents
  //     .filter((child) => child.labelName !== "Thumb opposition" && child.motorName === 'all_right_stretch')
  //     .forEach((child) => {
  //       expect(child.sliderFormControl.value).toBe(500);
  //       expect(child.sendAllMessagesCombined).toHaveBeenCalled();
  //     });
  // });

  it("should set all values to the value of the all_stretch slider (left)", fakeAsync(() => {
    component.side = "left";
    component.rightSwitchControl.setValue(false);
    fixture.detectChanges();

    const checkInput = fixture.debugElement.query(By.css("#leftSwitch"));
    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));
    spyOn(
      sliders.filter(
        (slider) => slider.componentInstance.motorName === "all_left_stretch",
      )[0].componentInstance,
      "sendMessage",
    );
    const slider = sliders.filter(
      (slider) => slider.componentInstance.motorName === "all_left_stretch",
    )[0];
    sliders
      .filter(
        (slider) => slider.componentInstance.motorName === "all_left_stretch",
      )[0]
      .componentInstance.sliderFormControl.setValue(500);

    const input = fixture.debugElement.query(
      By.css("#slider_all_left_stretch"),
    );
    input.nativeElement.dispatchEvent(new Event("input"));
    checkInput.nativeElement.dispatchEvent(new Event("input"));
    tick(500);
    fixture.detectChanges();
    sliders
      .filter(
        (slider) => slider.componentInstance.motorName === "all_left_stretch",
      )
      .forEach((child) => {
        expect(child.componentInstance.sliderFormControl.value).toBe(500);
        expect(child.componentInstance.sendMessage).toHaveBeenCalled();
      });
    expect(component.displayAll).toBe("none");
    expect(component.displayIndividual).toBe("block");
  }));

  it("should set all values to the value of the all_stretch slider (right)", fakeAsync(() => {
    component.side = "right";
    component.rightSwitchControl.setValue(false);
    fixture.detectChanges();

    const checkInput = fixture.debugElement.query(By.css("#rightSwitch"));
    const input = fixture.debugElement.query(
      By.css("#slider_all_right_stretch"),
    );
    const sliders = fixture.debugElement.queryAll(By.css("app-motor-control"));
    sliders.forEach((slider) => spyOn(slider.componentInstance, "sendMessage"));
    sliders
      .filter(
        (slider) => slider.componentInstance.motorName === "all_right_stretch",
      )[0]
      .componentInstance.sliderFormControl.setValue(500);
    input.nativeElement.dispatchEvent(new Event("input"));
    checkInput.nativeElement.dispatchEvent(new Event("input"));
    tick(500);
    fixture.detectChanges();
    sliders
      .filter(
        (slider) => slider.componentInstance.motorName === "all_right_stretch",
      )
      .forEach((child) => {
        expect(child.componentInstance.sliderFormControl.value).toBe(500);
        expect(child.componentInstance.sendMessage).toHaveBeenCalled();
      });
    expect(component.displayAll).toBe("none");
    expect(component.displayIndividual).toBe("block");
  }));

  it("should send dummy values", () => {
    component.side = "left";
    fixture.detectChanges();
    const dummyBtnLEft = fixture.debugElement.query(By.css("#dummyBtnLeft"));
    spyOn(rosService, "sendSliderMessage");
    dummyBtnLEft.nativeElement.click();
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(5);

    component.side = "right";
    fixture.detectChanges();
    const dummyBtnRight = fixture.debugElement.query(By.css("#dummyBtnRight"));
    dummyBtnRight.nativeElement.click();
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(10);
  });
});
