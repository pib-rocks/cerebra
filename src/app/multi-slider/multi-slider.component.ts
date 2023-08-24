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
import {Message} from "../shared/message";
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

    @Input() sliderName: string = "";
    @Input() minValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() defaultValue!: number;
    @Input() step: number = 1;
    @Input() unitOfMeasurement!: string;
    @Input() rotate: boolean = false;
    @Input() publishMessage!: (args: number) => void;
    @Input() messageReceiver$!: Subject<any>;

    sliderFormControl = new FormControl();
    sliderFormControlUpper = new FormControl();
    bubbleFormControl = new FormControl();

    timer: any = null;

    bubblePosition!: number;
    bubblePositionUpper!: number;
    isInputVisible = false;
    maxBubblePosition = 100;
    minBubblePosition = 0;
    pixelsFromEdge = 60;
    transformBoundaries = this.minValue + this.maxValue;
    imageSrc!: string;
    @Output() sliderEvent = new EventEmitter<number>();

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
        this.bubbleFormControl.setValue(this.sliderFormControl.value);
    }

    ngAfterViewInit() {
        const sliderWidth = document.getElementById("slider_" + this.sliderName)
            ?.clientWidth;
        if (sliderWidth !== undefined) {
            this.minBubblePosition = (this.pixelsFromEdge * 100) / sliderWidth;
            this.maxBubblePosition =
                ((sliderWidth - this.pixelsFromEdge) * 100) / sliderWidth;
        }
        this.setThumbPosition();
        if (this.rotate) {
            this.sliderElem.nativeElement.style.setProperty(
                "transform",
                "rotate(180deg)",
            );
        }
    }

    setSliderValue(sliderFormControl: FormControl, value: number) {
        sliderFormControl.setValue(value);
        this.setThumbPosition();
    }

    inputSendMsg(): void {
        if (this.sliderFormControl.value !== null) {
            this.sliderEvent.emit(this.sliderFormControl.value);
            this.timer = setTimeout(() => {
                if (this.publishMessage) {
                    this.publishMessage(Number(this.sliderFormControl.value));
                } else {
                    this.sendMessage();
                }
            }, 100);
        }
    }

    sendMessage() {
        const message: Message = {
            motor: this.sliderName,
            value: this.sliderFormControl.value,
        };
        this.rosService.sendSliderMessage(message);
    }

    toggleInputVisible(htmlInputElement: HTMLInputElement) {
        // console.log(event);
        // console.log(event.target);
        console.log(htmlInputElement);

        if (this.sliderFormControl.value !== null) {
            this.isInputVisible = !this.isInputVisible;
            setTimeout(() => {
                htmlInputElement.focus();
                htmlInputElement.select();
            }, 0);
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    toggleInputUnvisible(
        bubbleFormControl: FormControl,
        sliderFormControl: FormControl,
    ) {
        console.log(
            "bfcValue: " +
                bubbleFormControl.value +
                "\nsfCValue: " +
                sliderFormControl.value,
        );
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
                    // this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(sliderFormControl, this.maxValue);
                    // this.inputSendMsg();
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
                    // this.inputSendMsg();
                } else {
                    console.log("vluSFC" + sliderFormControl.value);
                    this.setSliderValue(
                        sliderFormControl,
                        Number(this.bubbleFormControl.value),
                    );
                    // this.inputSendMsg();
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }

        this.isInputVisible = false;
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
        let val =
            ((this.sliderFormControl.value - this.minValue) * 100) /
            (this.maxValue - this.minValue);
        if (this.rotate) {
            val = this.transformBoundaries - val;
        }
        setTimeout(() => {
            this.bubblePosition = val;
        }, 0);

        this.bubbleElement.nativeElement.style.left = /*this.rotate? `calc(1-${val})`: */ `calc(${val}%)`;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-lower",
            val.toString(10) + "%",
        );

        let val2 =
            ((this.sliderFormControlUpper.value - this.minValue) * 100) /
            (this.maxValue - this.minValue);
        setTimeout(() => {
            this.bubblePositionUpper = val2;
        }, 0);
        console.log(
            "bubblePositionUpper: " +
                this.bubblePositionUpper +
                "\nbubblePositionLower: " +
                this.bubblePosition,
        );
        this.bubbleElementUpper.nativeElement.style.left = /*this.rotate? `calc(1-${val})`: */ `calc(${val2}%)`;
        this.sliderElemUpper.nativeElement.style.setProperty(
            "--pos-upper",
            val2.toString(10) + "%",
        );
        this.setGradient();
    }

    setPosUpper() {
        const val = this.sliderFormControlUpper.value;
        this.sliderElemUpper.nativeElement.style.setProperty(
            "--pos-upper",
            val.toString(10) + "%",
        );
        this.setGradient();
    }
    setPosLower() {
        const val = this.sliderFormControl.value;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-lower",
            val.toString(10) + "%",
        );
        this.setGradient();
    }

    setGradient() {
        const upper =
            this.sliderFormControl.value >= this.sliderFormControlUpper.value
                ? this.sliderFormControl.value
                : this.sliderFormControlUpper.value;
        const lower =
            this.sliderFormControl.value < this.sliderFormControlUpper.value
                ? this.sliderFormControl.value
                : this.sliderFormControlUpper.value;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-upper",
            upper.toString(10) + "%",
        );
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-lower",
            lower.toString(10) + "%",
        );
        this.renderer.setStyle(
            this.sliderElem.nativeElement,
            "background",
            "linear-gradient(to right, #324c71, #324c71 var(--pos-lower), #e10072 var(--pos-lower), #e10072 var(--pos-upper), #324c71 var(--pos-upper), #324c71)",
        );
    }
}
