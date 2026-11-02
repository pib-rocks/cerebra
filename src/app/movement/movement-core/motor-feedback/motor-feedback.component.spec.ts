import {ComponentFixture, TestBed} from "@angular/core/testing";
import {MotorFeedbackComponent} from "./motor-feedback.component";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {BehaviorSubject} from "rxjs";

describe("MotorFeedbackComponent", () => {
    let component: MotorFeedbackComponent;
    let fixture: ComponentFixture<MotorFeedbackComponent>;
    let feedback$: BehaviorSubject<string | undefined>;

    const motor: MotorConfiguration = {
        motorName: "test_motor",
        motorPathName: "test-motor",
        label: "Test Motor",
        sliderIconLeft: "/left",
        sliderIconRight: "/right",
        captionLeft: "left",
        captionRight: "right",
        touchPointCenterX: 0.1,
        touchPointCenterY: 0.2,
        isMultiMotor: false,
        sourceMotorName: "test_motor",
    };

    beforeEach(async () => {
        feedback$ = new BehaviorSubject<string | undefined>(undefined);
        const motorServiceSpy = jasmine.createSpyObj("MotorService", [
            "getFeedbackObservable",
        ]);
        motorServiceSpy.getFeedbackObservable.and.returnValue(feedback$);

        await TestBed.configureTestingModule({
            imports: [MotorFeedbackComponent],
            providers: [{provide: MotorService, useValue: motorServiceSpy}],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorFeedbackComponent);
        component = fixture.componentInstance;
        component.motor = motor;
        component.feedback = "actual_position";
        fixture.detectChanges();
    });

    it("renders actual position with a degree label", () => {
        feedback$.next("12.25");
        fixture.detectChanges();

        const value = fixture.nativeElement.querySelector(
            "[data-test='TXT_Motor_Feedback_Value']",
        );
        expect(value?.textContent?.trim()).toBe("12.3 °");
    });

    it("shows the placeholder while no value arrived", () => {
        const value = fixture.nativeElement.querySelector(
            "[data-test='TXT_Motor_Feedback_Value']",
        );
        expect(value).toBeNull();
        expect(
            fixture.nativeElement.querySelector(".feedback-placeholder")
                ?.textContent,
        ).toContain("—");
    });

    it("passes a non-numeric actual position through unchanged", () => {
        feedback$.next("n/a");
        fixture.detectChanges();

        const value = fixture.nativeElement.querySelector(
            "[data-test='TXT_Motor_Feedback_Value']",
        );
        expect(value?.textContent?.trim()).toBe("n/a");
    });

    it("leaves temperature values unchanged", () => {
        component.feedback = "temperature";
        fixture.detectChanges();
        feedback$.next("41.5");
        fixture.detectChanges();

        const value = fixture.nativeElement.querySelector(
            "[data-test='TXT_Motor_Feedback_Value']",
        );
        expect(value?.textContent?.trim()).toBe("41.5");
    });
});
