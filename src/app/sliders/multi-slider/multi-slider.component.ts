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
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable, asyncScheduler} from "rxjs";
import {SliderThumb} from "./slider-thumb";
@Component({
    selector: "app-multi-slider",
    templateUrl: "./multi-slider.component.html",
    styleUrls: ["./multi-slider.component.css"],
})
export class MultiSliderComponent implements OnInit, AfterViewInit {
    @ViewChildren("bubble") bubbelElements!: QueryList<ElementRef>;
    @ViewChild("slider") slider!: ElementRef;

    @Input() leftValue!: number;
    @Input() rightValue!: number;
    @Input() defaultValues!: number[];
    @Input() step: number = 1;
    @Input() unitShort!: string;
    @Input() unitLong!: string;
    @Input() messageReceiver$!: Observable<number[]>;
    @Input() name: string = "";
    @Input() numberOfThumbs: number = 2;

    trackForegroundLeft: number = NaN;
    trackForegroundRight: number = NaN;

    @Input() thumbRadius: number = 12;
    @Input() trackHeight: number = 12;
    sliderWidth: number = 1;
    trackLength: number = 1;
    trackOffsetLeft: number = 1;

    thumbs!: SliderThumb[];
    thumbSelected: SliderThumb | null = null;

    timer: any = null;

    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;

    @Output() multiSliderEvent = new EventEmitter<number[]>();

    sliderResizeObserver: ResizeObserver = new ResizeObserver(() => {
        this.calculateOffsets();
    });

    calculateOffsets() {
        this.sliderWidth = this.slider.nativeElement.clientWidth;
        this.trackLength = this.sliderWidth - 2 * this.thumbRadius;
        this.trackOffsetLeft = this.thumbRadius;
        this.minBubblePosition = this.pixelsFromEdge;
        this.maxBubblePosition = this.sliderWidth - this.pixelsFromEdge;
        this.thumbs.forEach((thumb) => this.setThumbPosition(thumb));
    }

    ngOnInit(): void {
        this.thumbs = [];
        for (let i = 0; i < this.numberOfThumbs; i++) {
            this.thumbs.push({
                value: NaN,
                position: NaN,
                bubbleFormControl: new FormControl(),
                inputVisible: false,
            });
        }
        this.messageReceiver$?.subscribe((values: number[]) =>
            this.setAllThumbValues(values),
        );
    }

    ngAfterViewInit() {
        this.bubbelElements.forEach(
            (elem, idx) => (this.thumbs[idx].bubbleElement = elem),
        );
        asyncScheduler.schedule(() =>
            this.setAllThumbValues(this.defaultValues),
        );
        this.sliderResizeObserver.observe(this.slider.nativeElement);
        this.calculateOffsets();
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

    setThumbValue(thumb: SliderThumb, value: number) {
        thumb.value = value;
        thumb.bubbleFormControl.setValue(value);
        this.setThumbPosition(thumb);
    }

    setThumbPosition(thumb: SliderThumb) {
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        thumb.position = this.linearTransform(
            thumb.value,
            this.leftValue,
            this.rightValue,
            this.thumbRadius + this.trackHeight / 2,
            right - left - this.thumbRadius - this.trackHeight / 2,
        );
        const positions = this.thumbs.map((thumb) => thumb.position);
        this.trackForegroundLeft = Math.min(...positions);
        this.trackForegroundRight = Math.max(...positions);
    }

    setAllThumbValues(values: number[]) {
        if (values.length != this.numberOfThumbs) {
            throw new Error(
                `expected ${this.numberOfThumbs} values, but received: ${values}`,
            );
        }
        values.forEach((value, idx) =>
            this.setThumbValue(this.thumbs[idx], value),
        );
    }

    sendEvent() {
        const sortedValues = this.thumbs
            .map((thumb) => thumb.value)
            .sort((l, r) => l - r);
        clearTimeout(this.timer);
        this.timer = asyncScheduler.schedule(
            () => this.multiSliderEvent.emit(sortedValues),
            100,
        );
    }

    sanitizedSliderValue(value: any): number {
        value = Number(value);
        if (isNaN(value)) return value;
        let [min, max] = [this.leftValue, this.rightValue];
        if (min > max) [min, max] = [max, min];
        value = Math.min(Math.max(min, value), max);
        value *= 1000;
        value -= value % Math.floor(this.step * 1000);
        value /= 1000;
        return value;
    }

    toggleInputVisible(thumb: SliderThumb) {
        thumb.inputVisible = true;
        asyncScheduler.schedule(() => {
            thumb.bubbleElement?.nativeElement.focus();
            thumb.bubbleElement?.nativeElement.select();
        });
    }

    toggleInputInvisible(thumb: SliderThumb) {
        const value = this.sanitizedSliderValue(thumb.bubbleFormControl.value);
        this.setThumbValue(thumb, isNaN(value) ? thumb.value : value);
        thumb.inputVisible = false;
    }

    selectClosestSlider(mouseX: number) {
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        let targetValue = this.sanitizedSliderValue(
            this.linearTransform(
                mouseX,
                left + this.thumbRadius,
                right - this.thumbRadius,
                this.leftValue,
                this.rightValue,
            ),
        );
        this.thumbSelected = this.thumbs
            .map((thumb) => ({
                thumb,
                dist: Math.abs(thumb.value - targetValue),
            }))
            .sort((l, r) => l.dist - r.dist)[0].thumb;
    }

    moveSelectedSlider(mouseX: number) {
        if (!this.thumbSelected) return;
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        let nextValue = this.sanitizedSliderValue(
            this.linearTransform(
                mouseX,
                left + this.thumbRadius,
                right - this.thumbRadius,
                this.leftValue,
                this.rightValue,
            ),
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
