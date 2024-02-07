import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorPositionComponent} from "./motor-position.component";

describe("MotorPositionComponent", () => {
    let component: MotorPositionComponent;
    let fixture: ComponentFixture<MotorPositionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MotorPositionComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MotorPositionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
