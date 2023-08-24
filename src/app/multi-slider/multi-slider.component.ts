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
import {FormControl, Validators} from "@angular/forms";
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
    @ViewChild("bubbleInput") bubbleInput!: ElementRef;
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
        // this.messageReceiver$.subscribe((value) => {
        //     if (value) {
        //         this.sliderFormControl.setValue(
        //             this.getValueWithinRange(Number(value)),
        //         );
        //         if (this.sliderElem && this.bubbleElement) {
        //             this.setThumbPosition();
        //         }
        //     }
        // });
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

    setSliderValue(value: number) {
        this.sliderFormControl.setValue(value);
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

    toggleInputUnvisible() {
        if (this.bubbleFormControl.value !== this.sliderFormControl.value) {
            if (this.sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (this.bubbleFormControl.hasError("required")) {
                    this.bubbleFormControl.setValue(
                        this.sliderFormControl.value,
                    );
                } else if (this.bubbleFormControl.hasError("pattern")) {
                    this.bubbleFormControl.setValue(
                        this.sliderFormControl.value,
                    );
                } else if (this.bubbleFormControl.hasError("min")) {
                    this.setSliderValue(this.minValue);
                    this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(this.maxValue);
                    this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("steppingError")) {
                    let intBubbleFormControl = Math.floor(
                        this.bubbleFormControl.value * 1000,
                    );
                    const moduloValue =
                        intBubbleFormControl % Math.floor(this.step * 1000);
                    intBubbleFormControl -= moduloValue;
                    intBubbleFormControl /= 1000;
                    this.setSliderValue(intBubbleFormControl);
                    this.inputSendMsg();
                } else {
                    this.setSliderValue(Number(this.bubbleFormControl.value));
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
        let val =
            ((this.sliderFormControl.value - this.minValue) * 100) /
            (this.maxValue - this.minValue);
        if (this.rotate) {
            val = this.transformBoundaries - val;
        }
        setTimeout(() => {
            this.bubblePosition = val;
        }, 0);
        this.bubbleFormControl.setValue(this.sliderFormControl.value);
        this.bubbleElement.nativeElement.style.left = /*this.rotate? `calc(1-${val})`: */ `calc(${val}%)`;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-relative",
            val.toString(10) + "%",
        );
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
