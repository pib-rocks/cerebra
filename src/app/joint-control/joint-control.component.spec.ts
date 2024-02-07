import {ComponentFixture, TestBed} from "@angular/core/testing";

import {JointControlComponent} from "./joint-control.component";

describe("JointControlComponent", () => {
    let component: JointControlComponent;
    let fixture: ComponentFixture<JointControlComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JointControlComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(JointControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
