import {ComponentFixture, TestBed} from "@angular/core/testing";

import {JointControlCoreComponent} from "./joint-control-core.component";

describe("JointControlCoreComponent", () => {
    let component: JointControlCoreComponent;
    let fixture: ComponentFixture<JointControlCoreComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JointControlCoreComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(JointControlCoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
