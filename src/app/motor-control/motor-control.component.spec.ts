import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Message} from "roslib";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {
    compareValuesDegreeValidator,
    compareValuesPulseValidator,
} from "../shared/validators";

import {MotorControlComponent} from "./motor-control.component";
import {VoiceAssistant} from "../shared/voice-assistant";
import {MotorCurrentMessage} from "../shared/currentMessage";
import {
    createEmptyJointTrajectoryMessage,
    JointTrajectoryMessage,
} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {createJointTrajectoryPoint} from "../shared/rosMessageTypes/jointTrajectoryPoint";
import {MotorSettingsMessage} from "../shared/motorSettingsMessage";

describe("MotorControlComponent", () => {
    let component: MotorControlComponent;
    let fixture: ComponentFixture<MotorControlComponent>;
    let rosService: RosService;
    let modalService: NgbModal;
    let fingerService: MotorService;
    let motorService: MotorService;
    let spySendMotorSettings: jasmine.Spy<(msg: MotorSettingsMessage) => void>;
    let spySendMassege: jasmine.Spy<
        (msg: Message | VoiceAssistant | MotorCurrentMessage) => void
    >;
    let spySendJTMassege: jasmine.Spy<(msg: JointTrajectoryMessage) => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MotorControlComponent],
            imports: [ReactiveFormsModule],
            providers: [RosService, MotorService],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorControlComponent);
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);
        modalService = TestBed.inject(NgbModal);
        fingerService = TestBed.inject(MotorService);
        motorService = TestBed.inject(MotorService);
        spySendMassege = spyOn(rosService, "sendSliderMessage");
        spySendMotorSettings = spyOn(rosService, "sendMotorSettingsMessage");
        spySendJTMassege = spyOn(rosService, "sendJointTrajectoryMessage");
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

    it("should call sendJointTrajectoryMessage() of rosService when calling sendJointTrajectoryMessage()", () => {
        spyOn(component, "sendJointTrajectoryMessage").and.callThrough();
        component.sendJointTrajectoryMessage();
        expect(component.sendJointTrajectoryMessage).toHaveBeenCalled();
        expect(rosService.sendJointTrajectoryMessage).toHaveBeenCalled();
    });

    it("should call sendJointTrajectoryMessage() in inputSendJointTrajectoryMsg() on input event", fakeAsync(() => {
        spyOn(window, "clearTimeout");
        spyOn(window, "setTimeout");
        spyOn(component, "inputSendJointTrajectoryMsg").and.callThrough();
        spyOn(component, "sendJointTrajectoryMessage");

        const slider = fixture.nativeElement.querySelector(
            'input[type="range"]',
        );
        slider.value = 50;
        slider.dispatchEvent(new Event("input"));
        tick(500);
        expect(window.clearTimeout).toHaveBeenCalled();
        expect(window.setTimeout).toHaveBeenCalledWith(
            jasmine.any(Function),
            100,
        );
        const timeoutCallback = (
            window.setTimeout as unknown as jasmine.Spy
        ).calls.mostRecent().args[0];
        timeoutCallback();
        expect(component.inputSendJointTrajectoryMsg).toHaveBeenCalled();
        expect(component.sendJointTrajectoryMessage).toHaveBeenCalled();
    }));

    it("should call sendSettingsMessage() in inputSendSettingsMsg() on input event", fakeAsync(() => {
        spyOn(window, "clearTimeout");
        spyOn(window, "setTimeout");
        spyOn(component, "inputSendSettingsMsg").and.callThrough();
        spyOn(component, "sendMotorSettingsMessage");
        component.inputSendSettingsMsg();
        tick(500);
        expect(window.clearTimeout).toHaveBeenCalled();
        expect(window.setTimeout).toHaveBeenCalledWith(
            jasmine.any(Function),
            100,
        );
        const timeoutCallback = (
            window.setTimeout as unknown as jasmine.Spy
        ).calls.mostRecent().args[0];
        timeoutCallback();
        expect(component.inputSendSettingsMsg).toHaveBeenCalled();
        expect(component.sendMotorSettingsMessage).toHaveBeenCalled();
    }));

    it("should call sendJointTrajectoryMessage() to all finger topics on input from combined slider", () => {
        component.isCombinedSlider = true;
        component.groupSide = "left";
        component.sliderFormControl.setValue(500);
        fixture.detectChanges();
        fingerService.getMotorHandNames(component.groupSide);
        spyOn(component, "sendJointTrajectoryMessage").and.callThrough();
        component.sendJointTrajectoryMessage();
        expect(rosService.sendJointTrajectoryMessage).toHaveBeenCalled();
    });

    it("should set a valid value after receiving a message", () => {
        component.motorName = "thumb_left_stretch";
        const slider = fixture.nativeElement.querySelector(
            'input[type="range"]',
        );
        const jtMessage = createEmptyJointTrajectoryMessage();
        jtMessage.joint_names.push("thumb_left_stretch");
        jtMessage.points.push(createJointTrajectoryPoint(50000));
        component.jointTrajectoryMessageReceiver$.next(jtMessage);
        fixture.detectChanges();
        expect(slider.value).toBe(String(component.maxSliderValue));

        const jtMessage2 = createEmptyJointTrajectoryMessage();
        jtMessage2.joint_names.push("thumb_left_stretch");
        jtMessage2.points.push(createJointTrajectoryPoint(-50000));
        component.jointTrajectoryMessageReceiver$.next(jtMessage2);
        fixture.detectChanges();
        expect(slider.value).toBe(String(component.minSliderValue));
    });

    it("should change value after receiving a message", () => {
        component.motorName = "thumb_left_stretch";
        const slider = fixture.nativeElement.querySelector(
            'input[type="range"]',
        );

        const jtMessage = createEmptyJointTrajectoryMessage();
        jtMessage.joint_names.push("thumb_left_stretch");
        jtMessage.points.push(createJointTrajectoryPoint(500));
        component.jointTrajectoryMessageReceiver$.next(jtMessage);

        fixture.detectChanges();
        expect(slider.value).toBe("500");
    });

    it("should open dialog when the button has been clicked", () => {
        const spyPopup = spyOn(component, "openPopup").and.callThrough();
        const spyModal = spyOn(modalService, "open");
        const motorName = component.motorName;
        const button = fixture.debugElement.query(
            By.css("#dialogBtn_" + motorName),
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
            By.css("#dialogBtn_" + motorName),
        );
        button.nativeElement.click();
        modalService.dismissAll(ModalDismissReasons.BACKDROP_CLICK);
        tick(1000);
        expect(component.closeResult).toBe(
            "Dismissed by clicking on a backdrop",
        );
    }));

    it("should return dismiss reason by pressing ESC", fakeAsync(() => {
        spyOn(component, "openPopup").and.callThrough();
        spyOn(modalService, "open").and.callThrough();
        const motorName = component.motorName;
        const button = fixture.debugElement.query(
            By.css("#dialogBtn_" + motorName),
        );
        button.nativeElement.click();
        modalService.dismissAll(ModalDismissReasons.ESC);
        tick(1000);
        expect(component.closeResult).toBe("Dismissed by pressing ESC");
    }));

    it("should turn the motor on/off on checking the checkbox", () => {
        spyOn(component, "turnTheMotorOnAndOff").and.callThrough();
        spyOn(motorService, "getMotorHandNames").and.callThrough();
        const motorName = component.motorName;
        const checkbox = fixture.debugElement.query(
            By.css("#checkbox_" + motorName),
        );
        checkbox.nativeElement.dispatchEvent(new Event("change"));
        expect(component.turnTheMotorOnAndOff).toHaveBeenCalled();
        expect(spySendMotorSettings).toHaveBeenCalled();

        component.isCombinedSlider = true;
        component.groupSide = "left";
        fixture.detectChanges();
        component.turnTheMotorOnAndOff();
        expect(motorService.getMotorHandNames).toHaveBeenCalledWith("left");
        expect(spySendMotorSettings).toHaveBeenCalledTimes(7);
    });

    it("should send a settings message when changing a value of the setting", () => {
        const message: Message = {
            motorName: component.motorName,
            pulse_widths_min: component.pulseMinRange.value,
            pulse_widths_max: component.pulseMaxRange.value,
            rotation_range_min: component.degreeMinFormControl.value,
            rotation_range_max: component.degreeMaxFormControl.value,
            velocity: component.velocityFormControl.value,
            acceleration: component.accelerationFormControl.value,
            deceleration: component.decelerationFormControl.value,
            period: component.periodFormControl.value,
        };
        component.sendMotorSettingsMessage();
        expect(rosService.sendMotorSettingsMessage).toHaveBeenCalledWith(
            jasmine.objectContaining(message),
        );

        const spyMotorNames = spyOn(
            motorService,
            "getMotorHandNames",
        ).and.callThrough();
        component.isCombinedSlider = true;
        component.groupSide = "left";
        fixture.detectChanges();
        component.sendMotorSettingsMessage();
        expect(spyMotorNames).toHaveBeenCalledWith("left");
        expect(rosService.sendMotorSettingsMessage).toHaveBeenCalledTimes(7);
    });

    it("should return null if max pulse is greater than min pulse", () => {
        const formcontrol1 = new FormControl(0);
        const formControl2 = new FormControl(0);
        formcontrol1.addValidators(
            compareValuesPulseValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesPulseValidator(formcontrol1, formControl2),
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
            compareValuesPulseValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesPulseValidator(formcontrol1, formControl2),
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
            compareValuesPulseValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesPulseValidator(formcontrol1, formControl2),
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
            compareValuesDegreeValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesDegreeValidator(formcontrol1, formControl2),
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
            compareValuesDegreeValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesDegreeValidator(formcontrol1, formControl2),
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
            compareValuesDegreeValidator(formcontrol1, formControl2),
        );
        formControl2.addValidators(
            compareValuesDegreeValidator(formcontrol1, formControl2),
        );
        formcontrol1.setValue(-90000);
        formControl2.setValue(20);
        expect(formcontrol1.valid).toBe(false);
        expect(formControl2.valid).toBe(false);
        expect(formcontrol1.hasError("error")).toBe(true);
    });

    it("should make input element visible", (done) => {
        const mockElementRef = jasmine.createSpyObj("ElementRef", [""], {
            nativeElement: {
                focus: () => {
                    console.log("focus called");
                },
                select: () => {
                    console.log("select called");
                },
            },
        });
        spyOn(mockElementRef.nativeElement, "focus");
        spyOn(mockElementRef.nativeElement, "select");
        component.sliderFormControl.setValue(500);
        component.isInputVisible = false;
        component.bubbleInput = mockElementRef;
        component.toggleInputVisible();
        expect(component.isInputVisible).toBeTrue();
        setTimeout(() => {
            expect(mockElementRef.nativeElement.focus).toHaveBeenCalled();
            expect(mockElementRef.nativeElement.select).toHaveBeenCalled();
            done();
        }, 0);
    });

    it("should make input element unvisible", () => {
        component.sliderFormControl.setValue(null);
        component.toggleInputVisible();
        expect(component.isInputVisible).toBeTrue();
    });

    it("should toggle input unvisible", () => {
        spyOn(component, "setSliderValue");
        spyOn(component, "inputSendJointTrajectoryMsg");
        component.bubbleFormControl.setValue(500);
        component.isInputVisible = true;
        component.toggleInputInvisible();
        expect(component.setSliderValue).toHaveBeenCalled();
        expect(component.inputSendJointTrajectoryMsg).toHaveBeenCalled();
    });

    it("should toggle input unvisible min validation", fakeAsync(() => {
        spyOn(component, "setSliderValue");
        spyOn(component, "sendMotorSettingsMessage");
        spyOn(component, "toggleInputInvisible").and.callThrough();
        component.bubbleFormControl.setValue(-5000000);
        component.isInputVisible = true;
        component.toggleInputInvisible();
        expect(component.bubbleFormControl.hasError("min")).toBeTrue;
        expect(component.setSliderValue).toHaveBeenCalledWith(
            component.minSliderValue,
        );
        tick(500);
        expect(spySendJTMassege).toHaveBeenCalled();
    }));

    it("should toggle input unvisible max validation", fakeAsync(() => {
        spyOn(component, "setSliderValue");
        spyOn(component, "toggleInputInvisible").and.callThrough();
        spyOn(component, "sendMotorSettingsMessage");
        component.bubbleFormControl.setValue(5000000);
        component.isInputVisible = true;
        component.toggleInputInvisible();
        expect(component.bubbleFormControl.hasError("max")).toBeTrue;
        expect(component.setSliderValue).toHaveBeenCalledWith(
            component.maxSliderValue,
        );
        tick(500);
        expect(spySendJTMassege).toHaveBeenCalled();
    }));

    it("should toggle input unvisible required validation", () => {
        component.bubbleFormControl.setValue(null);
        component.isInputVisible = true;
        component.toggleInputInvisible();
        expect(component.bubbleFormControl.hasError("required")).toBeTrue;
        expect(component.isInputVisible).toBeFalse();
    });

    it("should toggle input unvisible pattern validation", () => {
        spyOn(component, "setThumbPosition");
        component.bubbleFormControl.setValue("test");
        component.isInputVisible = true;
        component.toggleInputInvisible();
        expect(component.bubbleFormControl.hasError("pattern")).toBeTrue;
    });
});
