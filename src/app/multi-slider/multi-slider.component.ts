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
    @ViewChild("slider") slider!: ElementRef;

    @Input() minValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() step: number = 1;
    @Input() unitShort!: string;
    @Input() unitLong!: string;
    @Input() publishMessage!: (args: number) => void;
    @Input() messageReceiver$!: Subject<number[]>;
    @Input() name?: string;
    @Input() id?: string;

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
    mouseDownX!: number;
    thumbWidth = 24;

    @Output() multiSliderEvent = new EventEmitter<number[]>();

    constructor(
        private rosService: RosService,
        private renderer: Renderer2,
    ) {}

    ngOnInit(): void {
        this.id = this.sanitizeNameForId(this.name);
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
            this.sliderFormControl?.value != null &&
            this.sliderFormControlUpper?.value != null
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

    toggleInputInvisible(
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
                    bubbleFormControl.setValue(this.minValue);
                    this.setSliderValue(sliderFormControl, this.minValue);
                } else if (bubbleFormControl.hasError("max")) {
                    bubbleFormControl.setValue(this.maxValue);
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
            this.sliderFormControl,
            this.bubbleElement.nativeElement,
            this.bubbleFormControl,
            (val) => setTimeout(() => (this.bubblePosition = val)),
        );
        this.setSingleThumbPosition(
            this.sliderElemUpper.nativeElement,
            this.sliderFormControlUpper,
            this.bubbleElementUpper.nativeElement,
            this.bubbleFormControlUpper,
            (val) => setTimeout(() => (this.bubblePositionUpper = val)),
        );
        this.setGradient();
    }

    setGradient() {
        const sliderWidth = this.sliderElem.nativeElement.clientWidth;

        const upper =
            this.sliderFormControl.value >= this.sliderFormControlUpper.value
                ? this.bubbleElement.nativeElement.offsetLeft
                : this.bubbleElementUpper.nativeElement.offsetLeft;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-upper",
            ((upper / sliderWidth) * 100).toString(10) + "%",
        );

        const lower =
            this.sliderFormControl.value < this.sliderFormControlUpper.value
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

    onMouseDown(event: MouseEvent) {
        this.mouseDownX = event.clientX;
    }

    onSliderClick(event: MouseEvent) {
        const clickLocation = event.clientX;
        if (clickLocation != this.mouseDownX) {
            this.setThumbPosition();
            this.sendEvent();
            return;
        }
        const elementWidth = this.slider.nativeElement.offsetWidth;
        const offsetLeft =
            this.slider.nativeElement.getBoundingClientRect().left;

        const relativeThumbMove = (clickLocation - offsetLeft) / elementWidth;

        const sliderValue =
            relativeThumbMove * (this.maxValue - this.minValue) + this.minValue;

        const diff = this.maxValue - this.minValue;
        const upper =
            (this.sliderFormControlUpper.value - this.minValue) / diff;
        const lower = (this.sliderFormControl.value - this.minValue) / diff;

        if (
            Math.abs(relativeThumbMove - upper) >
            Math.abs(relativeThumbMove - lower)
        ) {
            this.sliderFormControl.setValue(Math.floor(sliderValue));
        } else {
            this.sliderFormControlUpper.setValue(Math.floor(sliderValue));
        }
        this.setThumbPosition();
        this.sendEvent();
    }
}
