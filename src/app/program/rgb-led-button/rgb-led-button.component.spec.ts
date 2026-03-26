import {ComponentFixture, TestBed} from "@angular/core/testing";

import {RgbLedButtonComponent} from "./rgb-led-button.component";

describe("RgbLedButtonComponent", () => {
    let component: RgbLedButtonComponent;
    let fixture: ComponentFixture<RgbLedButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RgbLedButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(RgbLedButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
