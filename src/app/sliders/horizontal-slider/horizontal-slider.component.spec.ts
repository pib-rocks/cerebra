import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";

import {HorizontalSliderComponent} from "./horizontal-slider.component";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Subject} from "rxjs";
import {EventEmitter} from "@angular/core";

describe("HorizontalSliderComponent", () => {
    let component: HorizontalSliderComponent;
    let fixture: ComponentFixture<HorizontalSliderComponent>;
    const testSubject: Subject<number[]> = new Subject<number[]>();
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HorizontalSliderComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(HorizontalSliderComponent);
        component = fixture.componentInstance;
        component.messageReceiver$ = testSubject;
        component.leftValue = -200;
        component.rightValue = 200;
        component.minBubblePosition = 20;
        component.maxBubblePosition = 80;
        component.step = 10;
        component.name = "test";
        component.thumbRadius = 12;
        component.numberOfThumbs = 2;
        component.defaultValues = [0, 0];
        component.sliderWidth = 1000;
        component.sliderEvent = new EventEmitter<number[]>();
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should sanitize values correctly if leftValue is smaller than rightValue", () => {
        expect(component.sanitizedSliderValue("not a number")).toBeNaN();
        expect(component.sanitizedSliderValue(2000)).toEqual(200);
        expect(component.sanitizedSliderValue(-2000)).toEqual(-200);
        expect(component.sanitizedSliderValue(0)).toEqual(0);
        expect(component.sanitizedSliderValue(11)).toEqual(10);
        expect(component.sanitizedSliderValue(16)).toEqual(20);
    });

    it("should sanitize values correctly if leftValue is greater than rightValue", () => {
        component.leftValue = 200;
        component.rightValue = -200;
        expect(component.sanitizedSliderValue(2000)).toEqual(200);
        expect(component.sanitizedSliderValue(-2000)).toEqual(-200);
        expect(component.sanitizedSliderValue(0)).toEqual(0);
    });

    it("should transform values correctly", () => {
        expect(component.linearTransform(30, 10, 110, 10, 20)).toBeCloseTo(
            12,
            5,
        );
        expect(component.linearTransform(30, 110, 10, 10, 20)).toBeCloseTo(
            18,
            5,
        );
        expect(component.linearTransform(30, 10, 110, 20, 10)).toBeCloseTo(
            18,
            5,
        );
    });

    it("should set thumb positions correctly", () => {
        component.thumbs = [
            {
                valueRaw: 0,
                valueSanitized: 0,
                position: NaN,
                bubbleFormControl: new FormControl(),
                inputVisible: false,
            },
            {
                valueRaw: 0,
                valueSanitized: 0,
                position: 200,
                bubbleFormControl: new FormControl(),
                inputVisible: false,
            },
        ];
        component.sliderWidth = 1000;
        spyOn(component, "linearTransform").and.returnValues(100, 300);
        component.setThumbPosition(component.thumbs[0]);
        expect(component.thumbs[0].position).toEqual(100);
        expect(component.currentMinBubblePosition).toEqual(100);
        expect(component.currentMaxBubblePosition).toEqual(200);
        component.setThumbPosition(component.thumbs[0]);
        expect(component.thumbs[0].position).toEqual(300);
        expect(component.currentMinBubblePosition).toEqual(200);
        expect(component.currentMaxBubblePosition).toEqual(300);
    });

    it("should calculate static positional properties correctly", () => {
        component.slider = {nativeElement: {clientWidth: 1000}};
        component.thumbRadius = 30;
        component.trackHeight = 10;
        component.pixelsFromEdge = 2;
        const setPositionSpy = spyOn(component, "setThumbPosition");
        component.calculateStaticPositionalProperties();
        expect(component.sliderWidth).toEqual(1000);
        expect(component.trackOuterOffset).toEqual(25);
        expect(component.trackLength).toEqual(950);
        expect(component.minBubblePosition).toEqual(2);
        expect(component.maxBubblePosition).toEqual(998);
        for (const thumb of component.thumbs) {
            expect(setPositionSpy).toHaveBeenCalledWith(thumb);
        }
    });

    it("should throw an error, if all thumb values are tried to set with inadequate number of values", () => {
        expect(() => component.setAllThumbValues([0])).toThrow(
            new Error("expected 2 values, but received only 1"),
        );
    });

    it("should set all thumb values", () => {
        const setThumbValueSpy = spyOn(component, "setThumbValue");
        component.setAllThumbValues([1, 2]);
        expect(setThumbValueSpy).toHaveBeenCalledWith(component.thumbs[0], 1);
        expect(setThumbValueSpy).toHaveBeenCalledWith(component.thumbs[0], 1);
        expect(setThumbValueSpy).toHaveBeenCalledTimes(2);
    });

    it("should send event", fakeAsync(() => {
        const eventSpy = spyOn(component.sliderEvent, "emit");
        component.thumbs[0].valueSanitized = 20;
        component.thumbs[1].valueSanitized = 10;
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        tick(50);
        expect(eventSpy).toHaveBeenCalledOnceWith([10, 20]);
    }));

    it("should send only one event if the frequency in which events occur is too thigh", fakeAsync(() => {
        const eventSpy = spyOn(component.sliderEvent, "emit");
        component.thumbs[0].valueSanitized = 20;
        component.thumbs[1].valueSanitized = 10;
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        component.thumbs[1].valueSanitized = 30;
        component.sendEvent();
        tick(50);
        expect(eventSpy).not.toHaveBeenCalled();
        tick(50);
        expect(eventSpy).toHaveBeenCalledOnceWith([20, 30]);
    }));

    it("should select the closest slider", () => {
        component.thumbs[0].valueSanitized = 0;
        component.thumbs[1].valueSanitized = 100;
        spyOn(component, "linearTransform").and.returnValues(20, 80);
        component.selectClosestSlider(NaN);
        expect(component.thumbSelected).toBe(component.thumbs[0]);
        component.selectClosestSlider(NaN);
        expect(component.thumbSelected).toBe(component.thumbs[1]);
    });

    it("should do nothing if no thumb was selected", () => {
        const setThumbValueSpy = spyOn(component, "setThumbValue");
        const sendEventSpy = spyOn(component, "sendEvent");
        component.moveSelectedSlider(NaN);
        expect(setThumbValueSpy).not.toHaveBeenCalled();
        expect(sendEventSpy).not.toHaveBeenCalled();
    });

    it("should move the selected slider", () => {
        const setThumbValueSpy = spyOn(component, "setThumbValue");
        const sendEventSpy = spyOn(component, "sendEvent");
        spyOn(component, "linearTransform").and.returnValue(100);
        component.thumbSelected = component.thumbs[0];
        spyOn(
            component.slider.nativeElement,
            "getBoundingClientRect",
        ).and.returnValue({
            left: -20,
            right: 20,
        });
        component.moveSelectedSlider(50);
        expect(setThumbValueSpy).toHaveBeenCalledOnceWith(
            component.thumbs[0],
            100,
        );
        expect(sendEventSpy).toHaveBeenCalled();
    });
});

describe("HorizontalSliderComponent live feedback", () => {
    let component: HorizontalSliderComponent;
    let fixture: ComponentFixture<HorizontalSliderComponent>;

    /**
     * Every builder call gets its own subject: a component that is not destroyed keeps
     * listening, and a shared subject would feed values into sliders with a different
     * number of thumbs.
     */
    function buildSlider(numberOfThumbs: number): Subject<number[]> {
        const feed = new Subject<number[]>();
        fixture = TestBed.createComponent(HorizontalSliderComponent);
        component = fixture.componentInstance;
        component.messageReceiver$ = feed;
        component.leftValue = -200;
        component.rightValue = 200;
        component.minBubblePosition = 20;
        component.maxBubblePosition = 80;
        component.step = 1;
        component.name = "test";
        component.thumbRadius = 12;
        component.numberOfThumbs = numberOfThumbs;
        component.defaultValues = new Array<number>(numberOfThumbs).fill(0);
        component.sliderWidth = 1000;
        component.sliderEvent = new EventEmitter<number[]>();
        component.ngOnInit();
        fixture.detectChanges();
        return feed;
    }

    beforeEach(async () => {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HorizontalSliderComponent],
        }).compileComponents();
    });

    it("ignores the reported position while the operator drags the thumb", () => {
        // /joint_states arrives at ~10 Hz. Applying it mid-drag moves the thumb out from
        // under the pointer, so dragging became a fight between operator and robot.
        const feed = buildSlider(1);
        component.setAllThumbValues([-100]);
        component.thumbSelected = component.thumbs[0];
        feed.next([0]);
        expect(component.thumbs[0].valueSanitized).toBe(-100);
    });

    it("keeps the value it sent until the reported position has caught up", fakeAsync(() => {
        const feed = buildSlider(1);
        component.setAllThumbValues([0]);
        component.thumbSelected = component.thumbs[0];
        component.setThumbValue(component.thumbs[0], 120);
        component.unselectSlider();

        // The servo is still travelling: the thumb must not fall back to the old position.
        feed.next([-40]);
        expect(component.thumbs[0].valueSanitized).toBe(120);

        // Inside 2% of the 400 wide range the reported position takes over again.
        feed.next([124]);
        expect(component.thumbs[0].valueSanitized).toBe(124);
        feed.next([60]);
        expect(component.thumbs[0].valueSanitized).toBe(60);

        // A joint that never follows must not freeze the display forever.
        component.thumbSelected = component.thumbs[0];
        component.setThumbValue(component.thumbs[0], -80);
        component.unselectSlider();
        feed.next([-300]);
        expect(component.thumbs[0].valueSanitized).toBe(-80);
        tick(2100);
        feed.next([-120]);
        expect(component.thumbs[0].valueSanitized).toBe(-120);
    }));

    it("applies the reported positions again after the drag", () => {
        const feed = buildSlider(1);
        component.setAllThumbValues([0]);
        component.thumbSelected = component.thumbs[0];
        feed.next([50]);
        expect(component.thumbs[0].valueSanitized).toBe(0);
        component.thumbSelected = null;
        feed.next([70]);
        expect(component.thumbs[0].valueSanitized).toBe(70);
    });

    it("does not hold values for a two thumb slider, where they are not assignable to a thumb", () => {
        const feed = buildSlider(2);
        component.setAllThumbValues([0, 100]);
        component.thumbSelected = component.thumbs[0];
        component.unselectSlider();
        feed.next([10, 104]);
        expect(component.thumbs.map((t) => t.valueSanitized)).toEqual([
            10, 104,
        ]);
    });
});
