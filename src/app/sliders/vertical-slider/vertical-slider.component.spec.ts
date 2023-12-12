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
    let component!: VerticalSliderComponent;
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
        component.step = 10;
        component.rangeFormControl = new FormControl(0);
        component.messageReceiver$ = new Subject<number>();
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should sanitize values correctly", () => {
        expect(component.sanitizedSliderValue("not a number")).toBeNaN();
        expect(component.sanitizedSliderValue(2000)).toEqual(1000);
        expect(component.sanitizedSliderValue(-1000)).toEqual(0);
        expect(component.sanitizedSliderValue(500)).toEqual(500);
        expect(component.sanitizedSliderValue(11)).toEqual(10);
    });

    it("should handle value changes of the rangeFormControl correctly, if the input is a number", () => {
        const sanitizeSpy = spyOn(
            component,
            "sanitizedSliderValue",
        ).and.returnValue(400);
        const setPropertySpy = spyOn(
            component.slider?.nativeElement.style,
            "setProperty",
        );
        const setValueSpy = spyOn(
            component.rangeFormControl,
            "setValue",
        ).and.callThrough();
        const testValue = "this can be anything";
        component.rangeFormControl.setValue(testValue);
        expect(sanitizeSpy).toHaveBeenCalledOnceWith(testValue);
        expect(setPropertySpy).toHaveBeenCalledOnceWith(
            "--pos-relative",
            "40%",
        );
        expect(setValueSpy).toHaveBeenCalledTimes(2);
        expect(setValueSpy).toHaveBeenCalledWith(400);
    });

    it("should handle value changes of the rangeFormControl correctly, if the input is not a number", () => {
        const sanitizeSpy = spyOn(
            component,
            "sanitizedSliderValue",
        ).and.returnValue(NaN);
        const setPropertySpy = spyOn(
            component.slider?.nativeElement.style,
            "setProperty",
        );
        const setValueSpy = spyOn(
            component.rangeFormControl,
            "setValue",
        ).and.callThrough();
        const testValue = "this can be anything";
        component.rangeFormControl.setValue(testValue);
        expect(sanitizeSpy).toHaveBeenCalledOnceWith(testValue);
        expect(setPropertySpy).not.toHaveBeenCalled();
        expect(setValueSpy).toHaveBeenCalledTimes(1);
    });

    it("should send event", fakeAsync(() => {
        const eventSpy = spyOn(component.sliderEvent, "emit");
        component.rangeFormControl.setValue(200);
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        tick(50);
        expect(eventSpy).toHaveBeenCalledOnceWith(200);
    }));

    it("should send only one event if events occur in too high frequency", fakeAsync(() => {
        const eventSpy = spyOn(component.sliderEvent, "emit");
        component.rangeFormControl.setValue(200);
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        component.rangeFormControl.setValue(300);
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        tick(50);
        expect(eventSpy).toHaveBeenCalledOnceWith(300);
    }));
});
