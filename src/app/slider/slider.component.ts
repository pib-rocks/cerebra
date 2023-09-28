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
import {RosService} from "../shared/ros.service";
import {Message} from "../shared/message";
import {Observable} from "rxjs";
import {notNullValidator, steppingValidator} from "../shared/validators";
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

    constructor(private rosService: RosService) {}

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
                this.sliderFormControl.setValue(
                    this.getValueWithinRange(this.flip(Number(value))),
                );
                if (this.sliderElem && this.bubbleElement) {
                    setTimeout(() => this.setThumbPosition());
                }
            }
        });
        if (this.defaultValue) {
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
            this.timer = setTimeout(() => {
                if (this.publishMessage) {
                    this.publishMessage(
                        this.flip(Number(this.sliderFormControl.value)),
                    );
                }
                this.sliderEvent.emit(this.flip(this.sliderFormControl.value));
            }, 100);
        }
    }

    sendMessage() {
        const message: Message = {
            motor: this.sliderName,
            value: this.flip(this.sliderFormControl.value).toString(),
        };
        this.rosService.sendSliderMessage(message);
    }

    toggleInputVisible() {
        if (this.sliderFormControl.value !== null) {
            this.isInputVisible = !this.isInputVisible;
            setTimeout(() => {
                this.bubbleInput.nativeElement.focus();
                this.bubbleInput.nativeElement.select();
            }, 0);
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    toggleInputInvisible() {
        if (
            this.bubbleFormControl.value !==
            this.flip(this.sliderFormControl.value)
        ) {
            if (this.sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (
                    this.bubbleFormControl.hasError("required") ||
                    this.bubbleFormControl.hasError("pattern")
                ) {
                    this.bubbleFormControl.setValue(
                        this.flip(this.sliderFormControl.value),
                    );
                } else if (this.bubbleFormControl.hasError("min")) {
                    this.setSliderValue(this.flip(this.minValue));
                    this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(this.flip(this.maxValue));
                    this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("steppingError")) {
                    let intBubbleFormControl = Math.floor(
                        this.bubbleFormControl.value * 1000,
                    );
                    const moduloValue =
                        intBubbleFormControl % Math.floor(this.step * 1000);
                    intBubbleFormControl -= moduloValue;
                    intBubbleFormControl /= 1000;
                    this.setSliderValue(this.flip(intBubbleFormControl));
                    this.inputSendMsg();
                } else {
                    this.setSliderValue(
                        this.flip(Number(this.bubbleFormControl.value)),
                    );
                    this.inputSendMsg();
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    getValueWithinRange(value: number) {
        let validVal;
        if (value > this.maxValue) {
            validVal = this.maxValue;
        } else if (value < this.minValue) {
            validVal = this.minValue;
        } else {
            validVal = value;
        }
        return validVal;
    }

    setThumbPosition() {
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;

        const normalizedSliderVal =
            (this.sliderFormControl.value - this.minValue) /
            (this.maxValue - this.minValue);

        const bubbleOffset = (0.5 - normalizedSliderVal) * this.thumbWidth;
        const nextBubblePos = normalizedSliderVal * sliderWidth + bubbleOffset;
        setTimeout(() => {
            this.bubblePosition = nextBubblePos;
        }, 0);

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
