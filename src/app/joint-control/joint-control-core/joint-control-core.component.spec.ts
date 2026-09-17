import {ComponentFixture, TestBed} from "@angular/core/testing";

import {JointControlCoreComponent} from "./joint-control-core.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject, of} from "rxjs";
import {JointConfiguration} from "src/app/shared/types/joint-configuration";
import {VariantService} from "src/app/shared/services/variant.service";
import {MotorService} from "src/app/shared/services/motor.service";

describe("JointControlCoreComponent", () => {
    let component: JointControlCoreComponent;
    let fixture: ComponentFixture<JointControlCoreComponent>;

    let initialConfig: JointConfiguration;
    let data: BehaviorSubject<any>;
    let actualPositionAvailable: BehaviorSubject<boolean>;
    let temperatureAvailable: BehaviorSubject<boolean>;

    beforeEach(async () => {
        initialConfig = {
            jointPathName: "joint",
            label: "Joint",
            background: "/background-path",
            segmentHeight: 0.1,
            segmentOffset: 0.2,
            reversed: true,
            motors: [
                {
                    motorName: "test_motor",
                    motorPathName: "test-motor",
                    label: "Test Motor",
                    sliderIconLeft: "",
                    sliderIconRight: "",
                    captionLeft: "",
                    captionRight: "",
                    touchPointCenterX: 0,
                    touchPointCenterY: 0,
                    isMultiMotor: false,
                    sourceMotorName: "test_motor",
                },
            ],
        };

        data = new BehaviorSubject({joint: initialConfig});
        actualPositionAvailable = new BehaviorSubject(false);
        temperatureAvailable = new BehaviorSubject(false);
        const variantService = jasmine.createSpyObj("VariantService", [
            "hasFeedback",
        ]);
        variantService.hasFeedback.and.callFake((feedback: string) =>
            feedback === "actual_position"
                ? actualPositionAvailable
                : temperatureAvailable,
        );
        const motorService = jasmine.createSpyObj("MotorService", [
            "getSettingsObservable",
            "getCurrentObservable",
            "getFeedbackObservable",
        ]);
        motorService.getSettingsObservable.and.returnValue(
            of({
                velocity: 0,
                acceleration: 0,
                deceleration: 0,
                period: 0,
                pulseWidthMin: 0,
                pulseWidthMax: 0,
                rotationRangeMin: -9000,
                rotationRangeMax: 9000,
                turnedOn: true,
                visible: true,
                invert: false,
            }),
        );
        motorService.getCurrentObservable.and.returnValue(of(0));
        motorService.getFeedbackObservable.and.returnValue(of(undefined));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {data},
                },
                {provide: VariantService, useValue: variantService},
                {provide: MotorService, useValue: motorService},
            ],
            imports: [RouterTestingModule, JointControlCoreComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(JointControlCoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its joint-configuration from the route", () => {
        expect(component.joint).toBe(initialConfig);
        const nextConfig: JointConfiguration = {
            jointPathName: "other-joint",
            label: "Other Joint",
            background: "/background-path",
            segmentHeight: 0.1,
            segmentOffset: 0.2,
            reversed: false,
            motors: [],
        };
        data.next({joint: nextConfig});
        expect(component.joint).toBe(nextConfig);
    });

    it("keeps temperature and actual position hidden for edu capabilities", () => {
        const text = fixture.nativeElement.textContent;
        expect(text).not.toContain("Actual position");
        expect(text).not.toContain("Temperature");
    });

    it("shows temperature and actual position for advanced capabilities", () => {
        actualPositionAvailable.next(true);
        temperatureAvailable.next(true);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;
        expect(text).toContain("Actual position");
        expect(text).toContain("Temperature");
        expect(
            fixture.nativeElement.querySelectorAll(
                '[data-test^="Motor_Feedback_"]',
            ).length,
        ).toBe(2);
        expect(
            fixture.nativeElement.querySelector(".feedback-placeholder").title,
        ).toContain("not published");
    });
});
