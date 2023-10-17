import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {VerticalSliderComponent} from "./vertical-slider.component";
import {Subject} from "rxjs";

describe("VerticalSliderComponent", () => {
    let component: VerticalSliderComponent;
    let fixture: ComponentFixture<VerticalSliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VerticalSliderComponent],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(VerticalSliderComponent);
        component = fixture.componentInstance;
        component.maxValue = 1000;
        component.minValue = 0;
        component.rangeFormControl = new FormControl(0);
        component.messageReceiver$ = new Subject<number>();
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should sanitize values after change of values", fakeAsync(() => {
        const rangeFormControl: FormControl = component.rangeFormControl;
        const spyOnSanitizeValue = spyOn(component, "sanitizeValue");
        rangeFormControl.setValue(500);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        rangeFormControl.setValue(1500);
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(component.rangeFormControl.hasError("max")).toBeTruthy();
        rangeFormControl.setValue(-1500);
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(component.rangeFormControl.hasError("max")).toBeFalsy();
        expect(component.rangeFormControl.hasError("min")).toBeTruthy();
        rangeFormControl.setValue(300.5);
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(component.rangeFormControl.hasError("min")).toBeFalsy();
        expect(
            component.rangeFormControl.hasError("steppingError"),
        ).toBeTruthy();
        rangeFormControl.setValue("sdf");
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(
            component.rangeFormControl.hasError("steppingError"),
        ).toBeFalsy();
        expect(component.rangeFormControl.hasError("pattern")).toBeTruthy();
        rangeFormControl.setValue(null);
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(component.rangeFormControl.hasError("pattern")).toBeFalsy();
        expect(component.rangeFormControl.hasError("required")).toBeTruthy();
        rangeFormControl.setValue(500);
        tick(200);
        expect(spyOnSanitizeValue).toHaveBeenCalled();
        expect(component.rangeFormControl.hasError("required")).toBeFalsy();
        expect(rangeFormControl.value).toBe(500);
    }));
});
