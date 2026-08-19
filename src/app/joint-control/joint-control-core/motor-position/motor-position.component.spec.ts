import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorPositionComponent} from "./motor-position.component";
import {ActivatedRoute} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorSettings} from "src/app/shared/types/motor-settings.class";
import {BehaviorSubject, Subject} from "rxjs";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";
import {ReactiveFormsModule} from "@angular/forms";
import {CollisionJointLimits} from "src/app/shared/types/collision-joint-limits";

describe("MotorPositionComponent", () => {
    let component: MotorPositionComponent;
    let fixture: ComponentFixture<MotorPositionComponent>;

    let motorService: jasmine.SpyObj<MotorService>;
    let settingSubject: Subject<MotorSettings>;
    let positionSubject: Subject<number>;
    let collisionLimitsSubject: Subject<CollisionJointLimits | null>;

    let motorConfig: MotorConfiguration;
    let data: BehaviorSubject<{motor: MotorConfiguration}>;

    beforeEach(async () => {
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", [
                "getPositionObservable",
                "getSettingsObservable",
                "getCollisionLimitsObservable",
                "requestCollisionLimits",
                "setPosition",
            ]);

        motorConfig = {
            motorName: "test_motor",
            motorPathName: "test-motor",
            label: "Test Motor",
            sliderIconLeft: "/left-icon-path",
            sliderIconRight: "/right-icon-path",
            captionLeft: "closed",
            captionRight: "open",
            touchPointCenterX: 0.3,
            touchPointCenterY: 0.6,
            isMultiMotor: false,
            sourceMotorName: "test_motor",
        };
        data = new BehaviorSubject({motor: motorConfig});

        settingSubject = new Subject();
        positionSubject = new Subject();
        collisionLimitsSubject = new Subject();

        motorServiceSpy.getSettingsObservable.and.returnValue(settingSubject);
        motorServiceSpy.getPositionObservable.and.returnValue(positionSubject);
        motorServiceSpy.getCollisionLimitsObservable.and.returnValue(
            collisionLimitsSubject,
        );

        await TestBed.configureTestingModule({
            declarations: [MotorPositionComponent, HorizontalSliderComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {data},
                },
                {
                    provide: MotorService,
                    useValue: motorServiceSpy,
                },
            ],
            imports: [RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();

        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;

        fixture = TestBed.createComponent(MotorPositionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the data from the route", () => {
        const settingsSubject = jasmine.createSpyObj("settings-subject", [
            "subscribe",
        ]);
        const positionSubject = jasmine.createSpyObj("position-subject", [
            "subscribe",
        ]);
        const collisionLimitsSubject = jasmine.createSpyObj(
            "collision-limits-subject",
            ["subscribe"],
        );
        motorService.getSettingsObservable = jasmine
            .createSpy()
            .and.returnValue(settingsSubject);
        motorService.getPositionObservable = jasmine
            .createSpy()
            .and.returnValue(positionSubject);
        motorService.getCollisionLimitsObservable = jasmine
            .createSpy()
            .and.returnValue(collisionLimitsSubject);

        const nextConfig: MotorConfiguration = {
            motorName: "next_motor",
            motorPathName: "next-motor",
            label: "Next Motor",
            sliderIconLeft: "/left-icon",
            sliderIconRight: "/right-icon",
            captionLeft: "closed",
            captionRight: "open",
            touchPointCenterX: 0.2,
            touchPointCenterY: 0.9,
            isMultiMotor: false,
            sourceMotorName: "next_motor",
        };

        data.next({motor: nextConfig});

        expect(component.motor).toBe(nextConfig);
        expect(motorService.getSettingsObservable).toHaveBeenCalledOnceWith(
            "next_motor",
        );
        expect(motorService.getPositionObservable).toHaveBeenCalledOnceWith(
            "next_motor",
        );
        expect(
            motorService.getCollisionLimitsObservable,
        ).toHaveBeenCalledOnceWith("next_motor");
        expect(settingsSubject.subscribe).toHaveBeenCalledTimes(1);
        expect(positionSubject.subscribe).toHaveBeenCalledTimes(1);
        expect(collisionLimitsSubject.subscribe).toHaveBeenCalledTimes(1);
    });

    it("should set the position", () => {
        component.setPosition(20);
        expect(motorService.setPosition).toHaveBeenCalledOnceWith(
            "test_motor",
            2000,
        );
    });

    it("should intersect collision limits with configured motor limits", () => {
        settingSubject.next({
            velocity: 0,
            acceleration: 0,
            deceleration: 0,
            period: 0,
            pulseWidthMin: 0,
            pulseWidthMax: 0,
            rotationRangeMin: -6000,
            rotationRangeMax: 7000,
            turnedOn: true,
            visible: true,
            invert: false,
        });
        collisionLimitsSubject.next({
            motorName: "test_motor",
            minimum: -3550,
            maximum: 4260,
        });

        expect(component.rotationRangeMin).toBe(-35);
        expect(component.rotationRangeMax).toBe(42);
        expect(component.sliderRangeAvailable).toBeTrue();
    });
});
