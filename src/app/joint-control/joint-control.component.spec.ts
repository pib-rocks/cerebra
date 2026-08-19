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

    it("should show Reset immediately after Right Arm", () => {
        const tabLinks = fixture.nativeElement.querySelectorAll(
            ".nav-link",
        ) as NodeListOf<HTMLElement>;
        const tabLabels = Array.from(tabLinks).map(
            (element) => element.textContent?.trim(),
        );

        expect(tabLabels.slice(-2)).toEqual(["Right Arm", "Reset"]);
    });
});
