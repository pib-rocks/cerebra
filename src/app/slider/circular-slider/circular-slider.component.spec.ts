import {ComponentFixture, TestBed} from "@angular/core/testing";

import {CircularSliderComponent} from "./circular-slider.component";
import {MotorCurrentService} from "src/app/shared/motor-current.mock.service";
import {By} from "@angular/platform-browser";

describe("CircularSliderComponent", () => {
    let component: CircularSliderComponent;
    let fixture: ComponentFixture<CircularSliderComponent>;
    let currentService: MotorCurrentService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CircularSliderComponent],
            providers: [MotorCurrentService],
        }).compileComponents();
        currentService = TestBed.inject(MotorCurrentService);
        fixture = TestBed.createComponent(CircularSliderComponent);
        component = fixture.componentInstance;
        component.name = "thumb_left_stretch";
        component.ngAfterViewInit();

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set a value when subscribed Subject emits value", () => {
        component.ngAfterViewInit();
        const spyPercentage = spyOn(component, "percentage");

        component.gradientCircle = fixture.nativeElement.querySelector(
            "#thumb_left_stretch_gradientCircle",
        );
        // currentService.sendDummyMessageForGroup("left_hand");
        fixture.detectChanges();
        const subject =
            currentService.getMotorSubjectByName("thumb_left_stretch");
        subject?.next("1000");
        fixture.detectChanges();
        expect(spyPercentage).toHaveBeenCalled();
        expect(component.currentValue).not.toEqual(0);
    });
});
