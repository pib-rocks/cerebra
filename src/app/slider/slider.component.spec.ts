import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Message } from "roslib";
import { MotorService } from "../shared/motor.service";
import { RosService } from "../shared/ros.service";
import {
  compareValuesDegreeValidator,
  compareValuesPulseValidator,
} from "../shared/validators";

import { SliderComponent } from "./slider.component";

describe("SliderComponent", () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;
  let rosService: RosService;
  let modalService: NgbModal;
  let fingerService: MotorService;
  let motorService: MotorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SliderComponent],
      imports: [ReactiveFormsModule],
      providers: [RosService, MotorService],
    }).compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    modalService = TestBed.inject(NgbModal);
    fingerService = TestBed.inject(MotorService);
    motorService = TestBed.inject(MotorService);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a maximum range at 1000", () => {
    const slider = fixture.debugElement.queryAll(By.css("input"))[1]
      .nativeElement;
    expect(slider.max).toBe("9000");
  });

  it("should have a mininum range at -1000", () => {
    const slider = fixture.debugElement.queryAll(By.css("input"))[1]
      .nativeElement;
    expect(slider.min).toBe("-9000");
  });

  it("should call sendMessage() of rosService when calling sendMessage()", () => {
    spyOn(component, "sendMessage").and.callThrough();
    spyOn(rosService, "sendSliderMessage");
    component.sendMessage();
    expect(component.sendMessage).toHaveBeenCalled();
    expect(rosService.sendSliderMessage).toHaveBeenCalled();
  });

  it("should call sendMessage() in inputSendMsg() on input event", fakeAsync(() => {
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component,'inputSendMsg').and.callThrough();
    spyOn(component,'sendMessage');

    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = 50;
    slider.dispatchEvent(new Event("input"));
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.inputSendMsg).toHaveBeenCalled();
    expect(component.sendMessage).toHaveBeenCalled();
  }));

  it("should call sendSettingsMessage() in inputSendSettingsMsg() on input event", fakeAsync (() => {
    spyOn(window, 'clearTimeout');
    spyOn(window, 'setTimeout');
    spyOn(component, "inputSendSettingsMsg").and.callThrough();
    spyOn(component, "sendSettingMessage");
    component.inputSendSettingsMsg();
    tick(500);
    expect(window.clearTimeout).toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 500);
    const timeoutCallback = (window.setTimeout as unknown as jasmine.Spy).calls.mostRecent().args[0];
    timeoutCallback();
    expect(component.inputSendSettingsMsg).toHaveBeenCalled();
    expect(component.sendSettingMessage).toHaveBeenCalled();
  }));

  it("should call sendMessage() to all finger topics on input from combined slider", () => {
    component.isCombinedSlider = true;
    component.groupSide = "left";
    component.sliderFormControl.setValue(500);
    fixture.detectChanges();
    fingerService.getMotorHandNames(component.groupSide);
    spyOn(component, "sendMessage").and.callThrough();
    spyOn(rosService, "sendSliderMessage");
    component.sendMessage();
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(5);
  });

  it("should set a valid value after receiving a message", () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');

    let json = {
      motor: "thumb_left_stretch",
      value: "50000",
    };

    component.messageReceiver$.next(json);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.maxSliderValue));

    json = {
      motor: "thumb_left_stretch",
      value: "-50000",
    };

    component.messageReceiver$.next(json);
    fixture.detectChanges();
    expect(slider.value).toBe(String(component.minSliderValue));
  });

  it("should change value after receiving a message", () => {
    const slider = fixture.nativeElement.querySelector('input[type="range"]');
    const json = {
      motor: "thumb_left_stretch",
      value: "500",
    };
    component.messageReceiver$.next(json);

    fixture.detectChanges();
    expect(slider.value).toBe("500");
  });

  it("should open dialog when the button has been clicked", () => {
    const spyPopup = spyOn(component, "openPopup").and.callThrough();
    const spyModal = spyOn(modalService, "open");
    const motorName = component.motorName;
    const button = fixture.debugElement.query(
      By.css("#dialogBtn_" + motorName)
    );
    button.nativeElement.click();
    expect(spyPopup).toHaveBeenCalled();
    expect(spyModal).toHaveBeenCalled();
  });
  it("should return dismiss reason by clicking on a backdrop", fakeAsync(() => {
    spyOn(component, "openPopup").and.callThrough();
    spyOn(modalService, "open").and.callThrough();
    const motorName = component.motorName;
    const button = fixture.debugElement.query(
      By.css("#dialogBtn_" + motorName)
    );
    button.nativeElement.click();
    modalService.dismissAll(ModalDismissReasons.BACKDROP_CLICK);
    tick(1000);
    expect(component.closeResult).toBe("Dismissed by clicking on a backdrop");
  }));

  it("should return dismiss reason by pressing ESC", fakeAsync(() => {
    spyOn(component, "openPopup").and.callThrough();
    spyOn(modalService, "open").and.callThrough();
    const motorName = component.motorName;
    const button = fixture.debugElement.query(
      By.css("#dialogBtn_" + motorName)
    );
    button.nativeElement.click();
    modalService.dismissAll(ModalDismissReasons.ESC);
    tick(1000);
    expect(component.closeResult).toBe("Dismissed by pressing ESC");
  }));

  it("should turn the motor on/off on checking the checkbox", () => {
    const spyMotor = spyOn(component, "turnTheMotorOnAndOff").and.callThrough();
    const spySendMassege = spyOn(rosService, "sendSliderMessage");
    const motorName = component.motorName;
    const checkbox = fixture.debugElement.query(
      By.css("#checkbox_" + motorName)
    );
    checkbox.nativeElement.dispatchEvent(new Event("change"));
    expect(spyMotor).toHaveBeenCalled();
    expect(spySendMassege).toHaveBeenCalled();

    component.isCombinedSlider = true;
    component.groupSide = "left";
    fixture.detectChanges();
    component.turnTheMotorOnAndOff();
    expect(motorService.getMotorHandNames).toHaveBeenCalledWith("left");
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(6);
  });

  it("should send a settings message when changing a value of the setting", () => {
    const message: Message = {
      motor: component.motorName,
      pule_widths_min: component.pulseMinRange.value,
      pule_widths_max: component.pulseMaxRange.value,
      rotation_range_min: component.degreeMin.value,
      rotation_range_max: component.degreeMax.value,
      velocity: component.velocityFormControl.value,
      acceleration: component.accelerationFormControl.value,
      deceleration: component.decelerationFormControl.value,
      period: component.periodFormControl.value,
    };
    component.sendSettingMessage();
    expect(rosService.sendSliderMessage).toHaveBeenCalledWith(
      jasmine.objectContaining(message)
    );
    component.isCombinedSlider = true;
    component.groupSide = "left";
    fixture.detectChanges();
    component.sendSettingMessage();
    expect(motorService.getMotorHandNames).toHaveBeenCalledWith("left");
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(6);
  });

  it("should send a combined massege with all values if all inputs are valid", () => {
    const message: Message = {
      motor: component.motorName,
      value: component.sliderFormControl.value,
      turnedOn: component.motorFormControl.value,
      pule_widths_min: component.pulseMinRange.value,
      pule_widths_max: component.pulseMaxRange.value,
      rotation_range_min: component.degreeMin.value,
      rotation_range_max: component.degreeMax.value,
      velocity: component.velocityFormControl.value,
      acceleration: component.accelerationFormControl.value,
      deceleration: component.decelerationFormControl.value,
      period: component.periodFormControl.value,
    };
    component.sendAllMessagesCombined();
    expect(rosService.sendSliderMessage).toHaveBeenCalledWith(
      jasmine.objectContaining(message)
    );
    component.isCombinedSlider = true;
    component.groupSide = "left";
    fixture.detectChanges();
    component.sendAllMessagesCombined();
    expect(motorService.getMotorHandNames).toHaveBeenCalledWith("left");
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(6);
  });

  it("should send a combined massege with all values if not all inputs are valid", () => {
    const message: Message = {
      motor: component.motorName,
      value: component.sliderFormControl.value,
      turnedOn: component.motorFormControl.value,
    };
    component.pulseMinRange.setValue(10);
    component.pulseMaxRange.setValue(5);
    component.sendAllMessagesCombined();
    expect(rosService.sendSliderMessage).toHaveBeenCalledWith(
      jasmine.objectContaining(message)
    );

    component.isCombinedSlider = true;
    component.groupSide = "left";
    fixture.detectChanges();
    component.sendAllMessagesCombined();
    expect(motorService.getMotorHandNames).toHaveBeenCalledWith("left");
    expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(6);
  });

  it("should return null if max pulse is greater than min pulse", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(10);
    formControl2.setValue(20);
    expect(formcontrol1.valid).toBe(true);
    expect(formControl2.valid).toBe(true);
  });

  it("should return an error if max pulse is not greater than min pulse", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(20);
    formControl2.setValue(10);
    expect(formcontrol1.valid).toBe(false);
    expect(formControl2.valid).toBe(false);
    expect(formcontrol1.hasError("notGreaterThan")).toBe(true);
  });

  it("should return an error if max or min pulse are not greater than 0", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesPulseValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(-10);
    formControl2.setValue(20);
    expect(formcontrol1.valid).toBe(false);
    expect(formControl2.valid).toBe(false);
    expect(formcontrol1.hasError("error")).toBe(true);
  });

  it("should return null if max degree is greater than min degree", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(10);
    formControl2.setValue(20);
    expect(formcontrol1.valid).toBe(true);
    expect(formControl2.valid).toBe(true);
  });

  it("should return an error if max degree is not greater than min degree", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(20);
    formControl2.setValue(10);
    expect(formcontrol1.valid).toBe(false);
    expect(formControl2.valid).toBe(false);
    expect(formcontrol1.hasError("notGreaterThan")).toBe(true);
  });

  it("should return an error if max or min pulse are not greater than -9000", () => {
    const formcontrol1 = new FormControl(0);
    const formControl2 = new FormControl(0);
    formcontrol1.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formControl2.addValidators(
      compareValuesDegreeValidator(formcontrol1, formControl2)
    );
    formcontrol1.setValue(-90000);
    formControl2.setValue(20);
    expect(formcontrol1.valid).toBe(false);
    expect(formControl2.valid).toBe(false);
    expect(formcontrol1.hasError("error")).toBe(true);
  });
});
