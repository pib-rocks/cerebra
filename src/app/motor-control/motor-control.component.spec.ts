import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MotorService} from "../shared/motor.service";
import {SliderComponent} from "../slider/slider.component";
import {MotorControlComponent} from "./motor-control.component";
import {Motor} from "../shared/types/motor.class";
import {MotorSettings} from "../shared/types/motor-settings.class";
import {Group} from "../shared/types/motor.enum";
import {BehaviorSubject} from "rxjs";
import {RosService} from "../shared/ros.service";
import {VerticalSliderComponent} from "../vertical-slider/vertical-slider.component";

describe("MotorControlComponent", () => {
    let component: MotorControlComponent;
    let fixture: ComponentFixture<MotorControlComponent>;
    let motorService: MotorService;
    let modalService: NgbModal;
    let rosService: RosService;
    let motorSubject: BehaviorSubject<Motor> | undefined;
    let updateMotor: Motor;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MotorControlComponent,
                SliderComponent,
                VerticalSliderComponent,
            ],
            imports: [ReactiveFormsModule],
            providers: [RosService, MotorService, NgbModal],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorControlComponent);
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);
        rosService.initTopics();
        rosService.initSubscribers();
        modalService = TestBed.inject(NgbModal);
        motorService = TestBed.inject(MotorService);
        motorService.createMotors();
        component.motor = motorService.getMotorByName("ring_left_stretch");
        component.showMotorSettingsButton = true;
        motorSubject = motorService.getMotorSubjectByName("ring_left_stretch");
        updateMotor = new Motor(
            "ring_left_stretch",
            500,
            Group.left_hand,
            "undefined_label",
            new MotorSettings(500, 500, 500, 500, 500, 500, 500, 500, false),
        );
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should change value after receiving a message", () => {
        motorSubject?.next(updateMotor);
        expect(component.motor.position).toBe(500);
        expect(component.motor.settings.acceleration).toBe(500);
        expect(component.motor.settings.deceleration).toBe(500);
        expect(component.motor.settings.rotation_range_max).toBe(500);
        expect(component.motor.settings.rotation_range_min).toBe(500);
        expect(component.motor.settings.period).toBe(500);
        expect(component.motor.settings.pulse_width_max).toBe(500);
        expect(component.motor.settings.pulse_width_min).toBe(500);
        expect(component.motor.settings.turned_on).toBe(false);
    });

    it("should open settings modal on clicking the settings-button", () => {
        motorSubject?.next(updateMotor);
        const spyPopup = spyOn(component, "openPopup").and.callThrough();
        const spyModal = spyOn(modalService, "open").and.callThrough();
        const button = fixture.nativeElement.querySelector("#dialogBtn_");
        fixture.detectChanges();
        button.click();
        expect(spyPopup).toHaveBeenCalled();
        expect(spyModal).toHaveBeenCalled();
    });

    it("should return dismiss reason by clicking on a backdrop", fakeAsync(() => {
        motorSubject?.next(updateMotor);
        const button = fixture.nativeElement.querySelector("#dialogBtn_");
        fixture.detectChanges();
        button.click();
        modalService.dismissAll(ModalDismissReasons.BACKDROP_CLICK);
        tick(1000);
        expect(component.closeResult).toBe(
            "Dismissed by clicking on a backdrop",
        );
    }));

    it("should return dismiss reason by pressing ESC", fakeAsync(() => {
        motorSubject?.next(updateMotor);
        const spyOnGetDismissReason = spyOn(
            component,
            "getDismissReason",
        ).and.callThrough();
        const button = fixture.nativeElement.querySelector("#dialogBtn_");
        button.click();
        modalService.dismissAll(ModalDismissReasons.ESC);
        tick(1000);
        expect(spyOnGetDismissReason).toHaveBeenCalled();
        expect(component.closeResult).toBe("Dismissed by pressing ESC");
    }));

    it("should turn the motor on/off on checking the checkbox", () => {
        motorSubject?.next(updateMotor);
        expect(component.motor.settings.turned_on).toBe(false);
        const spyOnChangeTurnedOn = spyOn(
            component,
            "changeTurnedOn",
        ).and.callThrough();
        const checkbox = fixture.nativeElement.querySelector("#checkbox_");
        fixture.detectChanges();
        checkbox.click();
        expect(spyOnChangeTurnedOn).toHaveBeenCalled();
        expect(component.motor.settings.turned_on).toBe(true);
    });

    it("should change the motor position on capturing child-component event", () => {
        motorSubject?.next(updateMotor);
        const spyOnSetMotorPositionValue = spyOn(
            component,
            "setMotorPositionValue",
        ).and.callThrough();
        expect(component.motor.position).toBe(500);
        const slider = fixture.debugElement.query(By.css("app-slider"));
        slider.triggerEventHandler("sliderEvent", 300);
        expect(spyOnSetMotorPositionValue).toHaveBeenCalled();
        expect(component.motor.position).toBe(300);
    });

    it("should change the motor settings on getting events from vertical sliders", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetVelocity = spyOn(
            component,
            "setVelocity",
        ).and.callThrough();
        const spyOnSetAcceleration = spyOn(
            component,
            "setAcceleration",
        ).and.callThrough();
        const spyOnSetDeceleration = spyOn(
            component,
            "setDeceleration",
        ).and.callThrough();
        component.setVelocity(300);
        expect(spyOnSetVelocity).toHaveBeenCalled();
        expect(component.motor.settings.velocity).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings.velocity,
        ).toBe(300);
        component.setAcceleration(300);
        expect(spyOnSetAcceleration).toHaveBeenCalled();
        expect(component.motor.settings.acceleration).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .acceleration,
        ).toBe(300);
        component.setDeceleration(300);
        expect(spyOnSetDeceleration).toHaveBeenCalled();
        expect(component.motor.settings.deceleration).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .deceleration,
        ).toBe(300);
    });

    it("should set the degree on calling setDegree", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetDegree = spyOn(component, "setDegree").and.callThrough();
        component.setDegree([300, 300]);
        expect(spyOnSetDegree).toHaveBeenCalled();
        expect(component.motor.settings.rotation_range_max).toBe(300);
        expect(component.motor.settings.rotation_range_min).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .rotation_range_max,
        ).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .rotation_range_min,
        ).toBe(300);
    });

    it("should set the pulse ranges on calling setPulseRanges", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetPulseRanges = spyOn(
            component,
            "setPulseRanges",
        ).and.callThrough();
        component.setPulseRanges([300, 300]);
        expect(spyOnSetPulseRanges).toHaveBeenCalled();
        expect(component.motor.settings.pulse_width_max).toBe(300);
        expect(component.motor.settings.pulse_width_min).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .pulse_width_max,
        ).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings
                .pulse_width_min,
        ).toBe(300);
    });

    it("should set the periodon calling setPeriod", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetPeriod = spyOn(component, "setPeriod").and.callThrough();
        component.setPeriod(300);
        expect(spyOnSetPeriod).toHaveBeenCalled();
        expect(component.motor.settings.period).toBe(300);
        expect(
            motorService.getMotorByName(component.motor.name).settings.period,
        ).toBe(300);
    });
});
