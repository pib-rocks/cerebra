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
import {FormControl, Validators} from "@angular/forms";
import {Observable, asyncScheduler} from "rxjs";
import {notNullValidator, steppingValidator} from "../../shared/validators";

@Component({
    selector: "app-slider",
    templateUrl: "./slider.component.html",
    styleUrls: ["./slider.component.css"],
})
export class SliderComponent implements OnInit, AfterViewInit {
    @ViewChild("bubble") bubbleElement!: ElementRef;
    @ViewChild("bubbleInput") bubbleInput!: ElementRef;
    @ViewChild("range") sliderElem!: ElementRef;

    @Input() sliderName: string = "";
    @Input() minValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() defaultValue!: number | string;
    @Input() step: number = 1;
    @Input() unitOfMeasurement!: string;
    @Input() flipped: boolean = false;
    @Input() publishMessage!: (args: number) => void;
    @Input() messageReceiver$!: Observable<any>;

    sliderFormControl = new FormControl();
    bubbleFormControl = new FormControl();

    sliderResizeObserver: ResizeObserver = new ResizeObserver(() =>
        this.calculateBubbles(),
    );

    timer: any = null;

    thumbWidth: number = 24;
    bubblePosition!: number;
    isInputVisible = false;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    imageSrc!: string;
    @Output() sliderEvent = new EventEmitter<number>();

    ngOnInit(): void {
        this.bubbleFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^-?[0-9]{1,}\\.?[0-9]*$"),
            Validators.required,
            notNullValidator,
            steppingValidator(this.step),
        ]);
        this.messageReceiver$.subscribe((value) => {
            if (value !== undefined) {
                this.sliderFormControl.setValue(this.flip(Number(value)));
                if (this.sliderElem && this.bubbleElement) {
                    asyncScheduler.schedule(() => this.setThumbPosition());
                }
            }
        });
        if (this.defaultValue !== undefined) {
            this.sliderFormControl.setValue(
                this.flip(Number(this.defaultValue)),
            );
        }
        this.bubbleFormControl.setValue(
            this.flip(this.sliderFormControl.value),
        );
    }

    ngAfterViewInit() {
        this.calculateBubbles();
        this.sliderResizeObserver.observe(this.sliderElem.nativeElement);
    }

    calculateBubbles() {
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;
        this.minBubblePosition = this.pixelsFromEdge;
        this.maxBubblePosition = sliderWidth - this.pixelsFromEdge;
        this.setThumbPosition();
    }

    setSliderValue(value: number) {
        this.sliderFormControl.setValue(value);
        this.setThumbPosition();
    }

    inputSendMsg(): void {
        if (this.sliderFormControl.value !== null) {
            clearTimeout(this.timer);
            this.timer = asyncScheduler.schedule(() => {
                if (this.publishMessage) {
                    this.publishMessage(
                        this.flip(Number(this.sliderFormControl.value)),
                    );
                }
                this.sliderEvent.emit(this.flip(this.sliderFormControl.value));
            }, 100);
        }
    }

    showBubbleInputField() {
        if (this.sliderFormControl.value !== null) {
            this.isInputVisible = !this.isInputVisible;
            asyncScheduler.schedule(() => {
                this.bubbleInput.nativeElement.focus();
                this.bubbleInput.nativeElement.select();
            });
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    sliderInputFromBubble() {
        if (
            this.bubbleFormControl.value !==
            this.flip(this.sliderFormControl.value)
        ) {
            if (this.sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (this.validateAndSetBubbleInput()) this.inputSendMsg();
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    validateAndSetBubbleInput(): boolean {
        let updateSliderValue = true;
        let newSliderValue;

        if (
            this.bubbleFormControl.hasError("required") ||
            this.bubbleFormControl.hasError("pattern")
        ) {
            this.bubbleFormControl.setValue(
                this.flip(this.sliderFormControl.value),
            );
            updateSliderValue = false;
            return updateSliderValue;
        } else if (this.bubbleFormControl.hasError("min")) {
            newSliderValue = this.minValue;
        } else if (this.bubbleFormControl.hasError("max")) {
            newSliderValue = this.maxValue;
        } else if (this.bubbleFormControl.hasError("steppingError")) {
            let intBubbleFormControl = Math.floor(
                this.bubbleFormControl.value * 1000,
            );
            const moduloValue =
                intBubbleFormControl % Math.floor(this.step * 1000);
            intBubbleFormControl -= moduloValue;
            intBubbleFormControl /= 1000;
            newSliderValue = intBubbleFormControl;
        } else {
            newSliderValue = Number(this.bubbleFormControl.value);
        }

        if (updateSliderValue) this.setSliderValue(this.flip(newSliderValue));
        return updateSliderValue;
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
