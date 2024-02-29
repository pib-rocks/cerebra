import {
    Component,
    ElementRef,
    Input,
    ViewChild,
    Output,
    EventEmitter,
    OnInit,
    AfterViewInit,
    ViewChildren,
    QueryList,
    ChangeDetectorRef,
    OnDestroy,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable, asyncScheduler} from "rxjs";
import {SliderThumb} from "./slider-thumb";
@Component({
    selector: "app-horizontal-slider",
    templateUrl: "./horizontal-slider.component.html",
    styleUrls: ["./horizontal-slider.component.css"],
})
export class HorizontalSliderComponent
    implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
    @ViewChildren("bubbleInput") bubbleInputElems!: QueryList<ElementRef>;
    @ViewChild("slider") slider!: ElementRef;

    @Input() leftValue!: number;
    @Input() rightValue!: number;
    @Input() defaultValues!: number[];
    @Input() step: number = 1;
    @Input() unitShort: string = "";
    @Input() unitLong: string = "";
    @Input() messageReceiver$!: Observable<number[] | number>;
    @Input() name: string = "";
    @Input() displayName: boolean = false;
    @Input() numberOfThumbs: number = 1;
    @Input() thumbRadius: number = 12;
    @Input() trackHeight: number = 12;
    @Input() isActiveReceiver$: Observable<boolean> = new Observable();

    minValue!: number;
    maxValue!: number;

    isActive: boolean = true;

    currentMinBubblePosition: number = 0;
    currentMaxBubblePosition: number = 0;

    sliderWidth: number = 1000;
    trackLength: number = 1;
    trackOuterOffset: number = 1;

    thumbs!: SliderThumb[];
    thumbSelected: SliderThumb | null = null;

    timer: any = null;

    baseId!: string;

    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;

    @Output() sliderEvent = new EventEmitter<number[]>();
    sliderResizeObserver: ResizeObserver = new ResizeObserver(() => {
        this.calculateStaticPositionalProperties();
        this.ref.detectChanges();
    });

    constructor(private ref: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if ("leftValue" in changes) {
            this.leftValue = changes["leftValue"].currentValue;
        }
        if ("rightValue" in changes) {
            this.rightValue = changes["rightValue"].currentValue;
        }
        this.calculateStaticPositionalProperties();
    }

    calculateStaticPositionalProperties() {
        if (!this.slider) return; // if we don't check this, the motor-position-component tests fail
        this.sliderWidth = this.slider.nativeElement.clientWidth;
        this.trackOuterOffset = this.thumbRadius - this.trackHeight / 2;
        this.trackLength = this.sliderWidth - 2 * this.trackOuterOffset;
        this.minBubblePosition = this.pixelsFromEdge;
        this.maxBubblePosition = this.sliderWidth - this.pixelsFromEdge;
        this.thumbs.forEach((thumb) =>
            this.setThumbValue(thumb, thumb.valueRaw),
        );
    }

    ngOnInit(): void {
        this.baseId = this.name
            ? this.name.replace(" ", "_").toLowerCase()
            : "_";
        this.unitLong = this.unitLong || this.unitShort;
        this.thumbs = [];
        for (let i = 0; i < this.numberOfThumbs; i++) {
            this.thumbs.push({
                valueRaw: 0,
                valueSanitized: 0,
                position: 0,
                bubbleFormControl: new FormControl(),
                inputVisible: false,
                id: i,
            });
        }
        this.messageReceiver$?.subscribe((values: number[] | number) => {
            if (!this.thumbSelected) {
                this.setAllThumbValues(
                    typeof values == "number" ? [values] : values,
                );
            }
        });
        this.isActiveReceiver$.subscribe(
            (isActive) => (this.isActive = isActive),
        );
        this.ref.detectChanges();
    }

    ngAfterViewInit() {
        this.bubbleInputElems.forEach(
            (elem, idx) => (this.thumbs[idx].bubbleInputElem = elem),
        );
        asyncScheduler.schedule(() =>
            this.setAllThumbValues(this.defaultValues),
        );
        this.sliderResizeObserver.observe(this.slider.nativeElement);
        this.calculateStaticPositionalProperties();
        this.ref.detectChanges();
    }

    ngOnDestroy() {
        this.sliderResizeObserver.disconnect();
    }

    linearTransform(
        value: number,
        oldMin: number,
        oldMax: number,
        newMin: number,
        newMax: number,
    ) {
        value -= oldMin;
        value /= oldMax - oldMin;
        value *= newMax - newMin;
        value += newMin;
        return value;
    }

    setThumbValue(thumb: SliderThumb, value: number): boolean {
        const valueSanitized = this.sanitizedSliderValue(value);
        if (isNaN(valueSanitized)) return false;
        thumb.valueRaw = value;
        thumb.valueSanitized = valueSanitized;
        thumb.bubbleFormControl.setValue(valueSanitized);
        this.setThumbPosition(thumb);
        return true;
    }

    setThumbPosition(thumb: SliderThumb) {
        thumb.position = this.linearTransform(
            thumb.valueSanitized,
            this.leftValue,
            this.rightValue,
            this.thumbRadius,
            this.sliderWidth - this.thumbRadius - 1,
        );
        const positions = this.thumbs.map((thumb) => thumb.position);
        this.currentMinBubblePosition = Math.min(...positions);
        this.currentMaxBubblePosition = Math.max(...positions);
        this.ref.detectChanges();
    }

    setAllThumbValues(values: number[]) {
        if (values.length != this.numberOfThumbs) {
            throw new Error(
                `expected ${this.numberOfThumbs} values, but received only ${values.length}`,
            );
        }
        values.forEach((value, idx) =>
            this.setThumbValue(this.thumbs[idx], value),
        );
    }

    sendEvent() {
        const sortedValues = this.thumbs
            .map((thumb) => thumb.valueSanitized)
            .sort((l, r) => l - r);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.sliderEvent.emit(sortedValues), 100);
    }

    sanitizedSliderValue(value: any): number {
        value = Number(value);
        if (isNaN(value)) return value;
        value += this.step / 2;
        value =
            this.leftValue < this.rightValue
                ? Math.min(Math.max(this.leftValue, value), this.rightValue)
                : Math.min(Math.max(this.rightValue, value), this.leftValue);
        value *= 1000;
        let rest = value % Math.floor(this.step * 1000);
        if (rest < 0) rest += this.step * 1000;
        value -= rest;
        value /= 1000;
        return value;
    }

    toggleInputVisible(thumb: SliderThumb) {
        thumb.inputVisible = true;
        asyncScheduler.schedule(() => {
            thumb.bubbleInputElem?.nativeElement.focus();
            thumb.bubbleInputElem?.nativeElement.select();
        });
    }

    toggleInputInvisible(thumb: SliderThumb) {
        this.setThumbValue(thumb, thumb.bubbleFormControl.value);
        this.sendEvent();
        thumb.inputVisible = false;
    }

    selectClosestSlider(mouseX: number) {
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        const targetValue = this.linearTransform(
            mouseX,
            left + this.thumbRadius,
            right - this.thumbRadius,
            this.leftValue,
            this.rightValue,
        );
        this.thumbSelected = this.thumbs
            .map((thumb) => ({
                thumb,
                dist: Math.abs(thumb.valueSanitized - targetValue),
            }))
            .sort((l, r) => l.dist - r.dist)[0].thumb;
    }

    moveSelectedSlider(mouseX: number) {
        if (!this.thumbSelected) return;
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        const nextValue = this.linearTransform(
            mouseX,
            left + this.thumbRadius,
            right - this.thumbRadius - 1,
            this.leftValue,
            this.rightValue,
        );
        this.setThumbValue(this.thumbSelected, nextValue);
        this.sendEvent();
    }

    unselectSlider() {
        this.thumbSelected = null;
    }

    primaryButtonPressed(buttons: number): boolean {
        return (buttons & 1) === 1;
    }

    onMouseDown(event: MouseEvent) {
        if (this.primaryButtonPressed(event.buttons)) {
            this.selectClosestSlider(event.x);
            this.moveSelectedSlider(event.x);
        }
    }

    onMouseLeave(event: MouseEvent) {
        if (this.primaryButtonPressed(event.buttons)) {
            this.moveSelectedSlider(event.x);
        }
    }

    onMouseMove(event: MouseEvent) {
        this.moveSelectedSlider(event.x);
    }

    onMouseUp(event: MouseEvent) {
        if (!this.primaryButtonPressed(event.buttons)) {
            this.unselectSlider();
        }
    }

    onMouseEnter(event: MouseEvent) {
        if (this.primaryButtonPressed(event.buttons)) {
            this.moveSelectedSlider(event.x);
        } else {
            this.unselectSlider();
        }
    }
}
