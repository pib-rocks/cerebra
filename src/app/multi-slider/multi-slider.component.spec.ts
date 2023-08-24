import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MultiSliderComponent} from "./multi-slider.component";

describe("MultiSliderComponent", () => {
    let component: MultiSliderComponent;
    let fixture: ComponentFixture<MultiSliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MultiSliderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MultiSliderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
