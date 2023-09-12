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
import {Subject} from "rxjs";
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
    @Input() defaultValue!: number;
    @Input() step: number = 1;
    @Input() unitOfMeasurement!: string;
    @Input() rotate: boolean = false;
    @Input() publishMessage!: (args: number) => void;
    @Input() messageReceiver$!: Subject<any>;

    sliderFormControl = new FormControl();
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
            if (value) {
                this.sliderFormControl.setValue(
                    this.getValueWithinRange(Number(value)),
                );
                if (this.sliderElem && this.bubbleElement) {
                    this.setThumbPosition();
                }
            }
        });
        if (this.defaultValue) {
            this.sliderFormControl.setValue(this.defaultValue);
        }
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
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                if (this.publishMessage) {
                    this.publishMessage(Number(this.sliderFormControl.value));
                } else {
                    this.sendMessage();
                }
                this.sliderEvent.emit(this.sliderFormControl.value);
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

    toggleInputInvisible() {
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
}
