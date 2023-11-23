import {
    Component,
    ElementRef,
    Input,
    ViewChild,
    Output,
    EventEmitter,
    OnInit,
    AfterViewInit,
    Renderer2,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable, asyncScheduler} from "rxjs";
@Component({
    selector: "app-multi-slider",
    templateUrl: "./multi-slider.component.html",
    styleUrls: ["./multi-slider.component.css"],
})
export class MultiSliderComponent implements OnInit, AfterViewInit {
    @ViewChild("bubbleLower") bubbleElementLower!: ElementRef;
    @ViewChild("bubbleUpper") bubbleElementUpper!: ElementRef;
    @ViewChild("bubbleInputLower") bubbleInputLower!: ElementRef;
    @ViewChild("bubbleInputUpper") bubbleInputUpper!: ElementRef;
    @ViewChild("rangeLower") sliderElemLower!: ElementRef;
    @ViewChild("rangeUpper") sliderElemUpper!: ElementRef;
    @ViewChild("slider") slider!: ElementRef; // TODO: remove ?

    @Input() minValue!: number;
    @Input() maxValue!: number;
    @Input() defaultValueLower?: number;
    @Input() defaultValueUpper?: number;
    @Input() step: number = 1;
    @Input() unitShort!: string;
    @Input() unitLong!: string;
    @Input() messageReceiver$!: Observable<number[]>;
    @Input() name: string = "";

    sliderFormControlLower = new FormControl();
    sliderFormControlUpper = new FormControl();
    sliderFormControlSelected: FormControl | null = null;

    bubbleFormControlLower = new FormControl();
    bubbleFormControlUpper = new FormControl();
    bubbleFormControlSelected: FormControl | null = null;

    timer: any = null;

    thumbWidth = 24;
    bubblePositionLower!: number;
    bubblePositionUpper!: number;
    isInputVisibleLower: boolean = false;
    isInputVisibleUpper: boolean = false;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    mouseDownX!: number;

    @Output() multiSliderEvent = new EventEmitter<number[]>();

    constructor(private renderer: Renderer2) {}

    ngOnInit(): void {
        this.sliderFormControlLower.setValue(
            this.defaultValueLower ?? this.minValue,
        );
        this.sliderFormControlUpper.setValue(
            this.defaultValueUpper ?? this.maxValue,
        );
        this.bubbleFormControlLower.setValue(this.sliderFormControlLower.value);
        this.bubbleFormControlUpper.setValue(this.sliderFormControlUpper.value);
        this.messageReceiver$?.subscribe((value: number[]) => {
            if (
                this.sliderFormControlLower.value <
                this.sliderFormControlUpper.value
            ) {
                this.sliderFormControlLower.setValue(value[0]);
                this.sliderFormControlUpper.setValue(value[1]);
            } else {
                this.sliderFormControlUpper.setValue(value[0]);
                this.sliderFormControlLower.setValue(value[1]);
            }
            asyncScheduler.schedule(() => this.setThumbPosition());
        });
    }

    ngAfterViewInit() {
        this.setThumbPosition();
        const sliderWidth = this.sliderElemLower.nativeElement.clientWidth;
        this.minBubblePosition = this.pixelsFromEdge;
        this.maxBubblePosition = sliderWidth - this.pixelsFromEdge;
        this.renderer.setStyle(
            // TODO : ???
            this.sliderElemLower.nativeElement,
            "background",
            "linear-gradient(to right, #324c71, #324c71 var(--pos-lower), #e10072 var(--pos-lower), #e10072 var(--pos-upper), #324c71 var(--pos-upper), #324c71)",
        );
    }

    setSliderValue(sliderFormControl: FormControl, value: number) {
        sliderFormControl.setValue(value);
        this.setThumbPosition();
        this.sendEvent();
    }

    sendEvent() {
        if (
            this.sliderFormControlLower.value != null &&
            this.sliderFormControlUpper.value != null
        ) {
            clearTimeout(this.timer);
            this.timer = asyncScheduler.schedule(() => {
                this.multiSliderEvent.emit(
                    [
                        this.sliderFormControlLower.value,
                        this.sliderFormControlUpper.value,
                    ].sort((l, r) => l - r),
                );
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

    toggleInputVisible(
        htmlInputElement: HTMLInputElement,
        sliderFormControl: FormControl,
        bubbleFormControl: FormControl,
        lower: boolean,
    ) {
        if (sliderFormControl.value !== null) {
            bubbleFormControl.setValue(sliderFormControl.value);
            if (lower) this.isInputVisibleLower = true;
            else this.isInputVisibleUpper = true;
            asyncScheduler.schedule(() => {
                htmlInputElement.focus();
                htmlInputElement.select();
            });
        }
    }

    toggleInputInvisible(
        bubbleFormControl: FormControl,
        sliderFormControl: FormControl,
        lower: boolean,
    ) {
        const value = this.sanitizedSliderValue(bubbleFormControl.value);
        if (isNaN(value)) {
            bubbleFormControl.setValue(sliderFormControl.value);
        } else {
            bubbleFormControl.setValue(value);
            this.setSliderValue(sliderFormControl, value);
            if (lower) this.isInputVisibleLower = false;
            else this.isInputVisibleUpper = false;
        }
    }

    setSingleThumbPosition(
        sliderElem: HTMLElement,
        sliderForm: FormControl,
        bubbleElem: HTMLElement,
        bubbleForm: FormControl,
        bubblePosSetter: (val: number) => void,
    ) {
        const sliderWidth = sliderElem.clientWidth;

        const normalizedSliderVal =
            (sliderForm.value - this.minValue) /
            (this.maxValue - this.minValue);

        const bubbleOffset = (0.5 - normalizedSliderVal) * this.thumbWidth;
        const nextBubblePos = normalizedSliderVal * sliderWidth + bubbleOffset;
        bubblePosSetter(nextBubblePos);

        bubbleForm.setValue(Number(sliderForm.value));
        bubbleElem.style.left = `calc(${(nextBubblePos / sliderWidth) * 100}%)`;
    }

    setThumbPosition() {
        this.setSingleThumbPosition(
            this.sliderElemLower.nativeElement,
            this.sliderFormControlLower,
            this.bubbleElementLower.nativeElement,
            this.bubbleFormControlLower,
            (val) =>
                asyncScheduler.schedule(() => (this.bubblePositionLower = val)),
        );
        this.setSingleThumbPosition(
            this.sliderElemUpper.nativeElement,
            this.sliderFormControlUpper,
            this.bubbleElementUpper.nativeElement,
            this.bubbleFormControlUpper,
            (val) =>
                asyncScheduler.schedule(() => (this.bubblePositionUpper = val)),
        );
        this.setGradient();
    }

    setGradient() {
        const sliderWidth = this.sliderElemLower.nativeElement.clientWidth;

        const upper =
            this.sliderFormControlLower.value >=
            this.sliderFormControlUpper.value
                ? this.bubbleElementLower.nativeElement.offsetLeft
                : this.bubbleElementUpper.nativeElement.offsetLeft;
        this.sliderElemLower.nativeElement.style.setProperty(
            "--pos-upper",
            ((upper / sliderWidth) * 100).toString(10) + "%",
        );

        const lower =
            this.sliderFormControlLower.value <
            this.sliderFormControlUpper.value
                ? this.bubbleElementLower.nativeElement.offsetLeft
                : this.bubbleElementUpper.nativeElement.offsetLeft;
        this.sliderElemLower.nativeElement.style.setProperty(
            "--pos-lower",
            ((lower / sliderWidth) * 100).toString(10) + "%",
        );
    }

    getRelativeSliderValue(absoluteValue: number) {
        return (
            (absoluteValue - this.minValue) / (this.maxValue - this.minValue)
        );
    }

    getAbsoluteSliderValue(relativeValue: number) {
        return relativeValue * (this.maxValue - this.minValue) + this.minValue;
    }

    getRelativeMousePosition(mouseX: number) {
        const {left, right} = this.slider.nativeElement.getBoundingClientRect();
        return (mouseX - left) / (right - left);
    }

    selectClosestSlider(mouseX: number) {
        const targetSliderVal = this.getAbsoluteSliderValue(
            this.getRelativeMousePosition(mouseX),
        );
        [this.sliderFormControlSelected, this.bubbleFormControlSelected] =
            Math.abs(targetSliderVal - this.sliderFormControlUpper.value) <
            Math.abs(targetSliderVal - this.sliderFormControlLower.value)
                ? [this.sliderFormControlUpper, this.bubbleFormControlUpper]
                : [this.sliderFormControlLower, this.bubbleFormControlLower];
    }

    moveSelectedSlider(mouseX: number) {
        if (!this.sliderFormControlSelected) return;
        let nextValue = Math.floor(
            this.getAbsoluteSliderValue(this.getRelativeMousePosition(mouseX)),
        );
        nextValue = this.sanitizedSliderValue(nextValue);
        this.sliderFormControlSelected.setValue(nextValue);
        this.setThumbPosition();
        this.sendEvent();
    }

    unselectSlider() {
        this.sliderFormControlSelected = null;
        this.bubbleFormControlSelected = null;
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
        this.unselectSlider();
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
            this.selectClosestSlider(event.x);
            this.moveSelectedSlider(event.x);
        } else {
            this.unselectSlider();
        }
    }
}
