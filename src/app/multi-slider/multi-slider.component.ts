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
import {Form, FormControl, Validators} from "@angular/forms";
import {RosService} from "../shared/ros.service";
import {Subject} from "rxjs";
import {notNullValidator, steppingValidator} from "../shared/validators";

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

    @Input() minValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() step: number = 1;
    @Input() unitShort!: string;
    @Input() unitLong!: string;
    @Input() publishMessage!: (args: number) => void;
    @Input() messageReceiver$!: Subject<number[]>;
    @Input() name?: string;

    @Input() minInit?: number;
    @Input() maxInit?: number;
    @Input() sliderFormControl = new FormControl();
    @Input() sliderFormControlUpper = new FormControl();
    bubbleFormControl = new FormControl();
    bubbleFormControlUpper = new FormControl();

    timer: any = null;

    bubblePosition!: number;
    bubblePositionUpper!: number;
    isInputVisible?: boolean;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    @Output() multiSliderEvent = new EventEmitter<number[]>();

    constructor(
        private rosService: RosService,
        private renderer: Renderer2,
    ) {}

    ngOnInit(): void {
        this.bubbleFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^-?[0-9]{1,}\\.?[0-9]*$"),
            Validators.required,
            notNullValidator,
            steppingValidator(this.step),
        ]);
        this.bubbleFormControlUpper.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^-?[0-9]{1,}\\.?[0-9]*$"),
            Validators.required,
            notNullValidator,
            steppingValidator(this.step),
        ]);

        this.sliderFormControl.setValue(
            this.minInit ? this.minInit : this.minValue,
        );
        this.sliderFormControlUpper.setValue(
            this.maxInit ? this.maxInit : this.maxValue,
        );
        this.bubbleFormControl.setValue(this.sliderFormControl.value);
        this.bubbleFormControlUpper.setValue(this.sliderFormControlUpper.value);

        this.messageReceiver$?.subscribe((value: number[]) => {
            if (
                Number(this.sliderFormControl.value) <
                Number(this.sliderFormControlUpper.value)
            ) {
                this.sliderFormControl.setValue(value[0]);
                this.sliderFormControlUpper.setValue(value[1]);
            } else {
                this.sliderFormControlUpper.setValue(value[0]);
                this.sliderFormControl.setValue(value[1]);
            }
            this.setThumbPosition();
        });
    }

    ngAfterViewInit() {
        this.setThumbPosition();
        const sliderWidth = this.sliderElem?.nativeElement.clientWidth;
        if (sliderWidth !== undefined) {
            this.minBubblePosition = (this.pixelsFromEdge * 100) / sliderWidth;
            this.maxBubblePosition =
                ((sliderWidth - this.pixelsFromEdge) * 100) / sliderWidth;
        }
        this.renderer.setStyle(
            this.sliderElem.nativeElement,
            "background",
            "linear-gradient(to right, #324c71, #324c71 var(--pos-lower), #e10072 var(--pos-lower), #e10072 var(--pos-upper), #324c71 var(--pos-upper), #324c71)",
        );
    }

    sendEvent() {
        if (
            this.sliderFormControl?.value &&
            this.sliderFormControlUpper?.value
        ) {
            const lower =
                this.sliderFormControl.value >=
                this.sliderFormControlUpper.value
                    ? this.sliderFormControlUpper.value
                    : this.sliderFormControl.value;
            const upper =
                this.sliderFormControl.value < this.sliderFormControlUpper.value
                    ? this.sliderFormControlUpper.value
                    : this.sliderFormControl.value;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.multiSliderEvent.emit([lower, upper]);
            }, 100);
        }
    }

    setSliderValue(sliderFormControl: FormControl, value: number) {
        sliderFormControl.setValue(value);
        this.setThumbPosition();
        this.sendEvent();
    }

    toggleInputVisible(
        htmlInputElement: HTMLInputElement,
        sliderFormControl: FormControl,
        bubbleFormControl: FormControl,
    ) {
        if (sliderFormControl?.value !== null) {
            bubbleFormControl.setValue(sliderFormControl.value);
            this.isInputVisible = true;
            setTimeout(() => {
                htmlInputElement.focus();
                htmlInputElement.select();
            }, 0);
        }
    }

    toggleInputUnvisible(
        bubbleFormControl: FormControl,
        sliderFormControl: FormControl,
    ) {
        if (bubbleFormControl.value !== sliderFormControl.value) {
            if (sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (
                    bubbleFormControl.hasError("required") ||
                    bubbleFormControl.hasError("pattern")
                ) {
                    bubbleFormControl.setValue(sliderFormControl.value);
                } else if (bubbleFormControl.hasError("min")) {
                    this.setSliderValue(sliderFormControl, this.minValue);
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(sliderFormControl, this.maxValue);
                } else if (this.bubbleFormControl.hasError("steppingError")) {
                    let intBubbleFormControl = Math.floor(
                        this.bubbleFormControl.value * 1000,
                    );
                    const moduloValue =
                        intBubbleFormControl % Math.floor(this.step * 1000);
                    intBubbleFormControl -= moduloValue;
                    intBubbleFormControl /= 1000;
                    this.setSliderValue(
                        sliderFormControl,
                        intBubbleFormControl,
                    );
                } else {
                    this.setSliderValue(
                        sliderFormControl,
                        Number(bubbleFormControl.value),
                    );
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
        this.isInputVisible = false;
    }

    //Refactor, Berechnung 2mal vorhanden in setTHumb,
    setThumbPosition() {
        const val =
            ((this.sliderFormControl.value - this.minValue) * 100) /
            (this.maxValue - this.minValue);
        setTimeout(() => {
            this.bubblePosition = val;
        }, 0);

        this.bubbleElement.nativeElement.style.left = /*this.rotate? `calc(1-${val})`: */ `calc(${val}%)`;

        const val2 =
            ((this.sliderFormControlUpper.value - this.minValue) * 100) /
            (this.maxValue - this.minValue);
        setTimeout(() => {
            this.bubblePositionUpper = val2;
        }, 0);
        this.bubbleElementUpper.nativeElement.style.left = /*this.rotate? `calc(1-${val})`: */ `calc(${val2}%)`;
        this.setGradient();
    }

    setGradient() {
        const total = this.maxValue - this.minValue;
        const upper =
            (((this.sliderFormControl.value >= this.sliderFormControlUpper.value
                ? this.sliderFormControl.value
                : this.sliderFormControlUpper.value) -
                this.minValue) *
                100) /
            total;
        const lower =
            (((this.sliderFormControl.value < this.sliderFormControlUpper.value
                ? this.sliderFormControl.value
                : this.sliderFormControlUpper.value) -
                this.minValue) *
                100) /
            total;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-upper",
            upper.toString(10) + "%",
        );
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-lower",
            lower.toString(10) + "%",
        );
    }
}
