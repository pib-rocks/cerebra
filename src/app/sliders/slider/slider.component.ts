import {
    Component,
    ElementRef,
    Input,
    ViewChild,
    Output,
    EventEmitter,
    OnInit,
    AfterViewInit,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable, asyncScheduler} from "rxjs";

@Component({
    selector: "app-slider",
    templateUrl: "./slider.component.html",
    styleUrls: ["./slider.component.css"],
})
export class SliderComponent implements OnInit, AfterViewInit {
    @ViewChild("bubble") bubbleElement!: ElementRef;
    @ViewChild("bubbleInput") bubbleInput!: ElementRef;
    @ViewChild("range") sliderElem!: ElementRef;

    @Input() minValue!: number;
    @Input() maxValue!: number;
    @Input() defaultValue!: number;
    @Input() step: number = 1;
    @Input() unitOfMeasurement!: string;
    @Input() flipped: boolean = false;
    @Input() messageReceiver$!: Observable<number>;
    @Input() name: string = "";

    sliderFormControl = new FormControl();

    bubbleFormControl = new FormControl();

    timer: any = null;

    thumbWidth: number = 24;
    bubblePosition!: number;
    isInputVisible: boolean = false;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    imageSrc!: string;

    @Output() sliderEvent = new EventEmitter<number>();

    ngOnInit(): void {
        this.sliderFormControl.setValue(
            this.flip(this.defaultValue ?? this.minValue),
        );
        this.bubbleFormControl.setValue(
            this.flip(this.sliderFormControl.value),
        );
        this.messageReceiver$.subscribe((value: number) => {
            this.sliderFormControl.setValue(this.flip(value));
            asyncScheduler.schedule(() => this.setThumbPosition());
        });
    }

    ngAfterViewInit() {
        this.setThumbPosition();
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;
        this.minBubblePosition = this.pixelsFromEdge;
        this.maxBubblePosition = sliderWidth - this.pixelsFromEdge;
    }

    setSliderValue(value: number) {
        this.sliderFormControl.setValue(value);
        this.setThumbPosition();
    }

    sendEvent(): void {
        if (this.sliderFormControl.value !== null) {
            clearTimeout(this.timer);
            this.timer = asyncScheduler.schedule(() => {
                this.sliderEvent.emit(this.flip(this.sliderFormControl.value));
            }, 100);
        }
    }

    sanitizedSliderValue(value: any): number {
        value = Number(value);
        if (isNaN(value)) return value;
        value = Math.min(Math.max(this.minValue, value), this.maxValue);
        value *= 1000;
        value -= value % Math.floor(this.step * 1000);
        value /= 1000;
        return value;
    }

    toggleInputVisible() {
        if (this.sliderFormControl.value !== null) {
            this.bubbleFormControl.setValue(this.sliderFormControl.value);
            this.isInputVisible = true;
            asyncScheduler.schedule(() => {
                this.bubbleInput.nativeElement.focus();
                this.bubbleInput.nativeElement.select();
            });
        }
    }

    toggleInputInvisible() {
        const value = this.sanitizedSliderValue(this.bubbleFormControl.value);
        if (isNaN(value)) {
            this.bubbleFormControl.setValue(this.sliderFormControl.value);
        } else {
            this.bubbleFormControl.setValue(value);
            this.setSliderValue(value);
            this.isInputVisible = false;
        }
    }

    setThumbPosition() {
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;

        const normalizedSliderVal =
            (this.sliderFormControl.value - this.minValue) /
            (this.maxValue - this.minValue);

        const bubbleOffset = (0.5 - normalizedSliderVal) * this.thumbWidth;
        const nextBubblePos = normalizedSliderVal * sliderWidth + bubbleOffset;
        asyncScheduler.schedule(() => {
            this.bubblePosition = nextBubblePos;
        });

        this.bubbleFormControl.setValue(
            this.flip(this.sliderFormControl.value),
        );
        this.bubbleElement.nativeElement.style.left = `calc(${
            (nextBubblePos / sliderWidth) * 100
        }%)`;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-relative",
            ((nextBubblePos / sliderWidth) * 100).toString(10) + "%",
        );
    }

    flip(sliderVal: number): number {
        return this.flipped
            ? this.maxValue - (sliderVal - this.minValue)
            : sliderVal;
    }
}
