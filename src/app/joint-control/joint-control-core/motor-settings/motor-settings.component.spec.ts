import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorSettingsComponent} from "./motor-settings.component";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";
import {VerticalSliderComponent} from "src/app/sliders/vertical-slider/vertical-slider.component";
import {MotorService} from "src/app/shared/services/motor.service";
import {ReactiveFormsModule} from "@angular/forms";
import {Subject} from "rxjs";
import {MotorSettings} from "src/app/shared/types/motor-settings.class";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TemplateRef} from "@angular/core";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";

describe("MotorSettingsComponent", () => {
    let component: MotorSettingsComponent;
    let fixture: ComponentFixture<MotorSettingsComponent>;

    let motorService: jasmine.SpyObj<MotorService>;
    let settingsSubject: Subject<MotorSettings>;
    let settings: MotorSettings;
    let motor: MotorConfiguration;

    let modalService: jasmine.SpyObj<NgbModal>;

    beforeEach(async () => {
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", [
                "getSettingsObservable",
                "applySettings",
            ]);
        settingsSubject = new Subject();
        motorServiceSpy.getSettingsObservable.and.returnValue(settingsSubject);

        const modalServiceSpy: jasmine.SpyObj<NgbModal> = jasmine.createSpyObj(
            "NgbModal",
            ["open"],
        );

        settings = {
            velocity: 0,
            acceleration: 100,
            deceleration: 200,
            period: 300,
            pulseWidthMin: 400,
            pulseWidthMax: 500,
            rotationRangeMin: 600,
            rotationRangeMax: 700,
            turnedOn: true,
            visible: false,
            invert: false,
        };

        motor = {
            motorName: "test_motor",
            motorPathName: "test-motor",
            label: "Test Motor",
            sliderIconLeft: "/path-to-icon",
            sliderIconRight: "/path-to-icon",
            captionLeft: "left",
            captionRight: "right",
            touchPointCenterX: 0.2,
            touchPointCenterY: 0.3,
            isMultiMotor: true,
            sourceMotorName: "test_motor",
        };

        await TestBed.configureTestingModule({
            declarations: [
                MotorSettingsComponent,
                HorizontalSliderComponent,
                VerticalSliderComponent,
            ],
            providers: [
                {
                    provide: MotorService,
                    useValue: motorServiceSpy,
                },
                {
                    provide: NgbModal,
                    useValue: modalServiceSpy,
                },
            ],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

        fixture = TestBed.createComponent(MotorSettingsComponent);
        component = fixture.componentInstance;
        component.motor = motor;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its settings from the motor-service", () => {
        const pulseWidthSpy = spyOn(component.pulseWidthSubject$, "next");
        const degreeSpy = spyOn(component.degreeSubject$, "next");
        const periodSpy = spyOn(component.periodSubject$, "next");
        const decelerationSpy = spyOn(component.decelerationSubject$, "next");
        const accelerationSpy = spyOn(component.accelerationSubject$, "next");
        const velocitySpy = spyOn(component.velocitySubject$, "next");
        const turnedOnSpy = spyOn(component.turnedOnFormControl, "setValue");

        settingsSubject.next(settings);

        expect(pulseWidthSpy).toHaveBeenCalledOnceWith([400, 500]);
        expect(degreeSpy).toHaveBeenCalledOnceWith([6, 7]);
        expect(periodSpy).toHaveBeenCalledOnceWith([300]);
        expect(decelerationSpy).toHaveBeenCalledOnceWith(200);
        expect(accelerationSpy).toHaveBeenCalledOnceWith(100);
        expect(velocitySpy).toHaveBeenCalledOnceWith(0);
        expect(turnedOnSpy).toHaveBeenCalledOnceWith(true);

        const expectedSettings = structuredClone(settings);
        expect(component.settings).toEqual(expectedSettings);
    });

    it("should set the pulse-width", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.pulseWidthMin = 1000;
        settingsNew.pulseWidthMax = 1100;
        component.setPulseRanges([1000, 1100]);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the degree", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.rotationRangeMin = 1000;
        settingsNew.rotationRangeMax = 1100;
        component.setDegree([10, 11]);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the period", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.period = 1000;
        component.setPeriod(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the deceleration", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.deceleration = 1000;
        component.setDeceleration(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the acceleration", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.acceleration = 1000;
        component.setAcceleration(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should set the velocity", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.velocity = 1000;
        component.setVelocity(1000);
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should change turned-on", () => {
        const settingsNew: MotorSettings = structuredClone(settings);
        component.settings = settings;
        component.motor = motor;
        settingsNew.turnedOn = false;
        component.turnedOnFormControl.setValue(true);
        component.setTurnedOn();
        expect(motorService.applySettings).toHaveBeenCalledOnceWith(
            "test_motor",
            settingsNew,
        );
        expect(component.settings).toEqual(settingsNew);
    });

    it("should open a popup", () => {
        const content: TemplateRef<any> = {} as TemplateRef<any>;
        component.openPopup(content);
        expect(modalService.open).toHaveBeenCalledOnceWith(content, {
            ariaLabelledBy: "modal-basic-title",
            size: "xl",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
    });
});
