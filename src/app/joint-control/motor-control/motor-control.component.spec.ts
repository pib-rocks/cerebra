import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {MotorControlComponent} from "./motor-control.component";
import {Motor} from "../../shared/types/motor.class";
import {MotorSettings} from "../../shared/types/motor-settings.class";
import {Group} from "../../shared/types/motor.enum";
import {BehaviorSubject} from "rxjs";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {VerticalSliderComponent} from "../../sliders/vertical-slider/vertical-slider.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";

describe("MotorControlComponent", () => {
    let component: MotorControlComponent;
    let fixture: ComponentFixture<MotorControlComponent>;
    let motorService: jasmine.SpyObj<MotorService>;
    let modalService: NgbModal;
    let motorSubject: BehaviorSubject<Motor> | undefined;
    let updateMotor: Motor;
    beforeEach(async () => {
        const motorServiceSpy: jasmine.SpyObj<RosService> =
            jasmine.createSpyObj("RosService", ["updateMotorFromComponent"]);
        await TestBed.configureTestingModule({
            declarations: [
                MotorControlComponent,
                HorizontalSliderComponent,
                VerticalSliderComponent,
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                NgbModal,
                {
                    provide: MotorService,
                    useValue: motorServiceSpy,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorControlComponent);
        component = fixture.componentInstance;
        modalService = TestBed.inject(NgbModal);
        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;
        component.motor = new Motor(
            "ring_left_stretch",
            0,
            Group.left_hand,
            "Ring finger",
        );
        component.showMotorSettingsButton = true;
        motorSubject = component.motor.motorSubject;
        updateMotor = new Motor(
            "ring_left_stretch",
            500,
            Group.left_hand,
            "undefined_label",
            new MotorSettings(500, 500, 500, 500, 500, 500, 500, 500, false),
        );
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
        expect(component.motor.settings.rotationRangeMax).toBe(500);
        expect(component.motor.settings.rotationRangeMin).toBe(500);
        expect(component.motor.settings.period).toBe(500);
        expect(component.motor.settings.pulseWidthMax).toBe(500);
        expect(component.motor.settings.pulseWidthMin).toBe(500);
        expect(component.motor.settings.turnedOn).toBe(false);
        expect(component.motor.settings.invert).toBe(false);
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
        expect(component.motor.settings.turnedOn).toBe(false);
        const spyOnChangeTurnedOn = spyOn(
            component,
            "changeTurnedOn",
        ).and.callThrough();
        const checkbox = fixture.nativeElement.querySelector("#checkbox_");
        fixture.detectChanges();
        checkbox.click();
        expect(spyOnChangeTurnedOn).toHaveBeenCalled();
        expect(component.motor.settings.turnedOn).toBe(true);
    });

    it("should change the motor position on capturing child-component event", () => {
        motorSubject?.next(updateMotor);
        const spyOnSetMotorPositionValue = spyOn(
            component,
            "setMotorPositionValue",
        ).and.callThrough();
        expect(component.motor.position).toBe(500);
        const slider = fixture.debugElement.query(
            By.css("app-horizontal-slider"),
        );
        slider.triggerEventHandler("sliderEvent", [30]);
        expect(spyOnSetMotorPositionValue).toHaveBeenCalled();
        expect(component.motor.position).toBe(3000);
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
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    velocity: 300,
                }),
            }),
        );

        component.setAcceleration(300);
        expect(spyOnSetAcceleration).toHaveBeenCalled();
        expect(component.motor.settings.acceleration).toBe(300);
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    acceleration: 300,
                }),
            }),
        );

        component.setDeceleration(300);
        expect(spyOnSetDeceleration).toHaveBeenCalled();
        expect(component.motor.settings.deceleration).toBe(300);
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    deceleration: 300,
                }),
            }),
        );
    });

    it("should set the degree on calling setDegree", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetDegree = spyOn(component, "setDegree").and.callThrough();
        component.setDegree([-45, 45]);
        expect(spyOnSetDegree).toHaveBeenCalled();
        expect(component.motor.settings.rotationRangeMax).toBe(4500);
        expect(component.motor.settings.rotationRangeMin).toBe(-4500);
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    rotationRangeMax: 4500,
                    rotationRangeMin: -4500,
                }),
            }),
        );
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
        expect(component.motor.settings.pulseWidthMin).toBe(300);
        expect(component.motor.settings.pulseWidthMax).toBe(300);
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    pulseWidthMin: 300,
                    pulseWidthMax: 300,
                }),
            }),
        );
    });

    it("should set the period calling setPeriod", () => {
        motorSubject?.next(updateMotor);
        fixture.detectChanges();
        const spyOnSetPeriod = spyOn(component, "setPeriod").and.callThrough();
        component.setPeriod(300);
        expect(spyOnSetPeriod).toHaveBeenCalled();
        expect(component.motor.settings.period).toBe(300);
        expect(motorService.updateMotorFromComponent).toHaveBeenCalledWith(
            jasmine.objectContaining({
                name: "ring_left_stretch",
                settings: jasmine.objectContaining({
                    period: 300,
                }),
            }),
        );
    });

    it("should test invert checkbox", () => {
        motorSubject?.next(updateMotor);
        component.motor.settings.invert = false;
        fixture.detectChanges();
        const spyOnInvertInput = spyOn(
            component,
            "setInverteState",
        ).and.callThrough();
        component.setInverteState();
        fixture.detectChanges();
        expect(spyOnInvertInput).toHaveBeenCalled();
        expect(component.motor.settings.invert).toBeTrue();
        expect(motorService.updateMotorFromComponent).toHaveBeenCalled();
    });
});