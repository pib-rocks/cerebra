import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorSettingsComponent} from "./motor-settings.component";

describe("MotorSettingsComponent", () => {
    let component: MotorSettingsComponent;
    let fixture: ComponentFixture<MotorSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MotorSettingsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
