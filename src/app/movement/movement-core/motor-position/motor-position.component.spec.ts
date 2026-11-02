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

describe("MotorPositionComponent", () => {
    let component: MotorPositionComponent;
    let fixture: ComponentFixture<MotorPositionComponent>;

    let motorService: jasmine.SpyObj<MotorService>;
    let settingSubject: Subject<MotorSettings>;
    let positionSubject: Subject<number>;

    let motorConfig: MotorConfiguration;
    let data: BehaviorSubject<{motor: MotorConfiguration}>;

    beforeEach(async () => {
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", [
                "getPositionObservable",
                "getSettingsObservable",
                "setPosition",
                "refreshPosition",
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

        motorServiceSpy.getSettingsObservable.and.returnValue(settingSubject);
        motorServiceSpy.getPositionObservable.and.returnValue(positionSubject);

        await TestBed.configureTestingModule({
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
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                MotorPositionComponent,
                HorizontalSliderComponent,
            ],
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
        const nextSettingsSubject = new Subject<MotorSettings>();
        const nextPositionSubject = new Subject<number>();
        motorService.getSettingsObservable = jasmine
            .createSpy()
            .and.returnValue(nextSettingsSubject);
        motorService.getPositionObservable = jasmine
            .createSpy()
            .and.returnValue(nextPositionSubject);

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
        expect(nextSettingsSubject.observers.length).toBe(1);
        expect(nextPositionSubject.observers.length).toBe(1);

        nextPositionSubject.next(4200);
        expect(component.positionReceiver$.value).toEqual([42]);
    });

    it("should set the position", () => {
        component.setPosition(20);
        expect(motorService.setPosition).toHaveBeenCalledOnceWith(
            "test_motor",
            2000,
        );
    });

    it("labels the joint control slider in degrees", () => {
        const slider = fixture.nativeElement.querySelector(
            "app-horizontal-slider",
        );
        expect(slider?.textContent).not.toContain("μs");
        expect(slider?.textContent).toContain("°");
    });
});

describe("MotorPositionComponent position seed", () => {
    it("asks the servo for its position when the view opens", async () => {
        const motorServiceSpy = jasmine.createSpyObj("MotorService", [
            "getPositionObservable",
            "getSettingsObservable",
            "setPosition",
            "refreshPosition",
        ]);
        const positionSubject = new Subject<number>();
        const settingsSubject = new Subject<MotorSettings>();
        motorServiceSpy.getPositionObservable.and.returnValue(positionSubject);
        motorServiceSpy.getSettingsObservable.and.returnValue(settingsSubject);

        const motorConfig = {
            motorName: "test_motor",
            motorPathName: "test-motor",
            label: "Test Motor",
            sliderIconLeft: "/left",
            sliderIconRight: "/right",
            captionLeft: "closed",
            captionRight: "open",
            touchPointCenterX: 0.3,
            touchPointCenterY: 0.6,
            isMultiMotor: false,
            sourceMotorName: "test_motor",
        };

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, ReactiveFormsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {data: new BehaviorSubject({motor: motorConfig})},
                },
                {provide: MotorService, useValue: motorServiceSpy},
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(MotorPositionComponent);
        fixture.detectChanges();

        positionSubject.next(-4500);
        settingsSubject.next({
            turnedOn: true,
            pulseWidthMin: 1,
            pulseWidthMax: 2,
            rotationRangeMin: -9000,
            rotationRangeMax: 9000,
            velocity: 5,
            acceleration: 6,
            deceleration: 7,
            period: 8,
            visible: true,
            upperEndpoint: "max",
        } as MotorSettings);
        fixture.detectChanges();

        expect(motorServiceSpy.refreshPosition).toHaveBeenCalledWith(
            "test_motor",
        );
        expect(fixture.componentInstance.positionReceiver$.value).toEqual([
            -45,
        ]);
        expect(fixture.componentInstance.turnedOn).toBeTrue();
        expect(fixture.componentInstance.rotationRangeMin).toBe(-90);
    });
});
