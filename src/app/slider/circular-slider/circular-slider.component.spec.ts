import {ComponentFixture, TestBed} from "@angular/core/testing";

import {CircularSliderComponent} from "./circular-slider.component";

describe("CircularSliderComponent", () => {
    let component: CircularSliderComponent;
    let fixture: ComponentFixture<CircularSliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CircularSliderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CircularSliderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
