import {ComponentFixture, TestBed} from "@angular/core/testing";

import {JointControlComponent} from "./joint-control.component";
import {RouterTestingModule} from "@angular/router/testing";

describe("JointControlComponent", () => {
    let component: JointControlComponent;
    let fixture: ComponentFixture<JointControlComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JointControlComponent],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(JointControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
