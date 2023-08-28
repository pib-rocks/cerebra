import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";

import {MultiSliderComponent} from "./multi-slider.component";
import {RosService} from "../shared/ros.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Subject} from "rxjs";
import {EventEmitter} from "@angular/core";
import {By} from "@angular/platform-browser";

describe("MultiSliderComponent", () => {
    let component: MultiSliderComponent;
    let fixture: ComponentFixture<MultiSliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MultiSliderComponent],
            imports: [ReactiveFormsModule],
            providers: [RosService],
        }).compileComponents();
        fixture = TestBed.createComponent(MultiSliderComponent);
        component = fixture.componentInstance;
        component.messageReceiver$ = new Subject<number[]>();
        component.minValue = -200;
        component.maxValue = 200;
        component.minInit = 20;
        component.maxInit = 80;
        component.step = 1;
        component.name = "test";
        component.multiSliderEvent = new EventEmitter<number[]>();
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should change values appropriately for each sliderformcontrol after receiving a message from parent component", () => {
        component.messageReceiver$.next([0, 100]);
        const sfc: FormControl = component.sliderFormControl;
        const sfcUpper: FormControl = component.sliderFormControlUpper;
        fixture.detectChanges();
        expect(sfc.value).toBe(0);
        expect(sfcUpper.value).toBe(100);
        sfc.setValue(110);
        sfcUpper.setValue(30);
        component.messageReceiver$.next([0, 100]);
        fixture.detectChanges();
        expect(sfc.value).toBe(100);
        expect(sfcUpper.value).toBe(0);
    });

    it("should set the value and thumb for the respective form control and send the event when calling setSliderValue", () => {
        const spySendEvent = spyOn(component, "sendEvent");
        const spySetThumbPosition = spyOn(component, "setThumbPosition");
        component.setSliderValue(component.sliderFormControl, 55);
        expect(component.sliderFormControl.value).toBe(55);
        expect(spySendEvent).toHaveBeenCalled();
        expect(spySetThumbPosition).toHaveBeenCalled();
        component.setSliderValue(component.sliderFormControlUpper, 133);
        expect(component.sliderFormControlUpper.value).toBe(133);
        expect(spySendEvent).toHaveBeenCalled();
        expect(spySetThumbPosition).toHaveBeenCalled();
    });

    it("should set bubblePositions appropriately when calling setThumbPosition", fakeAsync(() => {
        component.sliderFormControl.setValue(0);
        component.sliderFormControlUpper.setValue(200);
        const spySetGradient = spyOn(component, "setGradient");
        component.setThumbPosition();
        tick(300);
        fixture.detectChanges();
        expect(component.bubblePosition).toBe(50);
        expect(component.bubblePositionUpper).toBe(100);
        expect(spySetGradient).toHaveBeenCalled();
    }));

    it("should emit an event when sendEvent has been called", fakeAsync(() => {
        const spyEventEmitter = spyOn(component.multiSliderEvent, "emit");
        component.sliderFormControl.setValue(100);
        component.sliderFormControlUpper.setValue(150);
        component.sendEvent();
        tick(200);
        expect(spyEventEmitter).toHaveBeenCalledWith([100, 150]);
    }));

    it("should call respective functions and set values on calling toggleInputUnvisible", () => {
        const spySetSliderValue = spyOn(component, "setSliderValue");
        const sFC = component.sliderFormControl;
        const bFC = component.bubbleFormControl;
        bFC.setValue(150);
        sFC.setValue(50);
        component.toggleInputUnvisible(bFC, sFC);
        expect(spySetSliderValue).toHaveBeenCalled();
        bFC.setValue("sdf");
        component.toggleInputUnvisible(bFC, sFC);
        expect(bFC.value).not.toBe("sdf");
        bFC.setValue(null);
        component.toggleInputUnvisible(bFC, sFC);
        expect(bFC.value).not.toBe(null);
    });

    it("should change the color gradient when calling setGradient", () => {
        component.ngAfterViewInit();
        component.sliderFormControl.setValue(0);
        component.sliderFormControlUpper.setValue(200);
        const debugElement = fixture.debugElement.query(
            By.css("input.bottom-layer"),
        );
        const htmlElement: HTMLInputElement = debugElement.nativeElement;
        expect(htmlElement).toBeTruthy();
        expect(htmlElement).toBeDefined();
        component.setGradient();
        fixture.detectChanges();
        const poslower = htmlElement.style.getPropertyValue("--pos-lower");
        const posupper = htmlElement.style.getPropertyValue("--pos-upper");
        expect(poslower).toBe("50%");
        expect(posupper).toBe("100%");
    });
});
