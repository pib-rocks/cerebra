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
    @ViewChild("bubble") bubbleElement!: ElementRef;
    @ViewChild("bubbleUpper") bubbleElementUpper!: ElementRef;
    @ViewChild("bubbleInput") bubbleInput!: ElementRef;
    @ViewChild("bubbleInputUpper") bubbleInputUpper!: ElementRef;
    @ViewChild("range") sliderElem!: ElementRef;
    @ViewChild("rangeUpper") sliderElemUpper!: ElementRef;
    @ViewChild("slider") slider!: ElementRef;

    @Input() minValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() step: number = 1;
    @Input() unitShort!: string;
    @Input() unitLong!: string;
    @Input() messageReceiver$!: Observable<number[]>;
    @Input() name?: string;
    @Input() id?: string;

    @Input() minInit?: number;
    @Input() maxInit?: number;

    @Input() sliderFormControlLower = new FormControl();
    @Input() sliderFormControlUpper = new FormControl();
    sliderFormControlSelected: FormControl | null = null;

    bubbleFormControlLower = new FormControl();
    bubbleFormControlUpper = new FormControl();
    bubbleFormControlSelected: FormControl | null = null;

    timer: any = null;

    bubblePosition!: number;
    bubblePositionUpper!: number;
    isInputVisible?: boolean;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    mouseDownX!: number;
    thumbWidth = 24;

    @Output() multiSliderEvent = new EventEmitter<number[]>();

    constructor(private renderer: Renderer2) {}

    ngOnInit(): void {
        this.id = this.sanitizeNameForId(this.name);

        this.sliderFormControlLower.setValue(
            this.minInit ? this.minInit : this.minValue,
        );
        this.sliderFormControlUpper.setValue(
            this.maxInit ? this.maxInit : this.maxValue,
        );
        this.bubbleFormControlLower.setValue(this.sliderFormControlLower.value);
        this.bubbleFormControlUpper.setValue(this.sliderFormControlUpper.value);

        this.messageReceiver$?.subscribe((value: number[]) => {
            if (
                Number(this.sliderFormControlLower.value) <
                Number(this.sliderFormControlUpper.value)
            ) {
                this.sliderFormControlLower.setValue(value[0]);
                this.sliderFormControlUpper.setValue(value[1]);
            } else {
                this.sliderFormControlUpper.setValue(value[0]);
                this.sliderFormControlLower.setValue(value[1]);
            }
            this.setThumbPosition();
        });
    }

    ngAfterViewInit() {
        this.setThumbPosition();
        const sliderWidth = this.sliderElem?.nativeElement.clientWidth;
        if (sliderWidth !== undefined) {
            this.minBubblePosition = this.pixelsFromEdge;
            this.maxBubblePosition = sliderWidth - this.pixelsFromEdge;
        }
        this.renderer.setStyle(
            this.sliderElem.nativeElement,
            "background",
            "linear-gradient(to right, #324c71, #324c71 var(--pos-lower), #e10072 var(--pos-lower), #e10072 var(--pos-upper), #324c71 var(--pos-upper), #324c71)",
        );
    }

    sendEvent() {
        if (
            this.sliderFormControlLower?.value != null &&
            this.sliderFormControlUpper?.value != null
        ) {
            const lower =
                this.sliderFormControlLower.value >=
                this.sliderFormControlUpper.value
                    ? this.sliderFormControlUpper.value
                    : this.sliderFormControlLower.value;
            const upper =
                this.sliderFormControlLower.value <
                this.sliderFormControlUpper.value
                    ? this.sliderFormControlUpper.value
                    : this.sliderFormControlLower.value;
            clearTimeout(this.timer);
            this.timer = asyncScheduler.schedule(() => {
                this.multiSliderEvent.emit([lower, upper]);
            }, 100);
        }
    }

    setSliderValue(sliderFormControl: FormControl, value: number) {
        sliderFormControl.setValue(value);
        this.setThumbPosition();
        this.sendEvent();
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
    ) {
        if (sliderFormControl?.value !== null) {
            bubbleFormControl.setValue(sliderFormControl.value);
            this.isInputVisible = true;
            asyncScheduler.schedule(() => {
                htmlInputElement.focus();
                htmlInputElement.select();
            });
        }
    }

    sliderInputFromBubble(
        bubbleFormControl: FormControl,
        sliderFormControl: FormControl,
    ) {
        const value = this.sanitizedSliderValue(bubbleFormControl.value);
        if (isNaN(value)) {
            bubbleFormControl.setValue(sliderFormControl.value);
            return;
        } else {
            bubbleFormControl.setValue(value);
            this.setSliderValue(sliderFormControl, value);
            this.isInputVisible = false;
        }
    }

    validateAndSetBubbleInput(
        bubbleFormControl: FormControl,
        sliderFormControl: FormControl,
    ) {
        if (
            bubbleFormControl.hasError("required") ||
            bubbleFormControl.hasError("pattern")
        ) {
            bubbleFormControl.setValue(sliderFormControl.value);
        } else if (bubbleFormControl.hasError("min")) {
            bubbleFormControl.setValue(this.minValue);
            this.setSliderValue(sliderFormControl, this.minValue);
        } else if (bubbleFormControl.hasError("max")) {
            bubbleFormControl.setValue(this.maxValue);
            this.setSliderValue(sliderFormControl, this.maxValue);
        } else if (bubbleFormControl.hasError("steppingError")) {
            let intBubbleFormControl = Math.floor(
                bubbleFormControl.value * 1000,
            );
            const moduloValue =
                intBubbleFormControl % Math.floor(this.step * 1000);
            intBubbleFormControl -= moduloValue;
            intBubbleFormControl /= 1000;
            this.setSliderValue(sliderFormControl, intBubbleFormControl);
        } else {
            this.setSliderValue(
                sliderFormControl,
                Number(bubbleFormControl.value),
            );
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
        bubbleElem.style.left = `calc(${nextBubblePos}px)`;
    }

    setThumbPosition() {
        this.setSingleThumbPosition(
            this.sliderElem.nativeElement,
            this.sliderFormControlLower,
            this.bubbleElement.nativeElement,
            this.bubbleFormControlLower,
            (val) => setTimeout(() => (this.bubblePosition = val)),
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
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;

        const upper =
            this.sliderFormControlLower.value >=
            this.sliderFormControlUpper.value
                ? this.bubbleElement.nativeElement.offsetLeft
                : this.bubbleElementUpper.nativeElement.offsetLeft;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-upper",
            ((upper / sliderWidth) * 100).toString(10) + "%",
        );

        const lower =
            this.sliderFormControlLower.value <
            this.sliderFormControlUpper.value
                ? this.bubbleElement.nativeElement.offsetLeft
                : this.bubbleElementUpper.nativeElement.offsetLeft;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-lower",
            ((lower / sliderWidth) * 100).toString(10) + "%",
        );
    }

    sanitizeNameForId(name: string | undefined) {
        if (!name) {
            return "NAME_NOT_PASSED";
        }
        return name.replace(" ", "_").toLowerCase();
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
