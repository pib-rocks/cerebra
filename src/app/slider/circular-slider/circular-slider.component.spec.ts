import {ComponentFixture, TestBed} from "@angular/core/testing";

import {CircularSliderComponent} from "./circular-slider.component";
import {MotorCurrentService} from "src/app/shared/motor-current.service";

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

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set a value when subscribed Subject emits value", () => {
        const spyPercentage = spyOn(component, "percentage");
        const subject =
            currentService.getMotorSubjectByName("thumb_left_stretch");
        subject?.next("1000");
        fixture.detectChanges();
        expect(spyPercentage).toHaveBeenCalled();
        expect(component.currentValue).not.toEqual(0);
    });
});
