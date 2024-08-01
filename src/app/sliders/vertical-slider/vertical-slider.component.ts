import {
    Component,
    Input,
    OnInit,
    ElementRef,
    ViewChild,
    AfterViewInit,
    EventEmitter,
    Output,
    Renderer2
} from "@angular/core";
import {FormControl} from "@angular/forms";
import { Svg } from "blockly/core/utils";
import {Observable} from "rxjs";

@Component({
    selector: "app-vertical-slider",
    templateUrl: "./vertical-slider.component.html",
    styleUrls: ["./vertical-slider.component.css"],
})
export class VerticalSliderComponent implements OnInit, AfterViewInit {
    @ViewChild("slider") slider?: ElementRef;
    @ViewChild("sliderticks") sliderTicks?: ElementRef;
    @Input() step: number = 1;

    @Input() defaultValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() minValue: number = 0;
    @Input() name?: string;
    @Input() showPrompt: boolean = true;
    @Input() showTextInput: boolean = true;
    @Input() unitShort?: string;
    @Input() unitLong?: string;
    @Input() id = "";
    @Input() messageReceiver$!: Observable<any>;

    @Output() sliderEvent = new EventEmitter<number>();

    timer: any;
    rangeFormControl: FormControl = new FormControl();
    valueSanitized: boolean = false;
    constructor(
        private renderer: Renderer2
      ) {}

    ngOnInit(): void {
        this.rangeFormControl.setValue(this.defaultValue);
        this.messageReceiver$.subscribe((value: number) => {
            this.rangeFormControl.setValue(value);
        });
    }

    ngAfterViewInit(): void {
        this.rangeFormControl.valueChanges.subscribe(() => {
            if (this.valueSanitized) {
                this.valueSanitized = false;
                const slider: ElementRef["nativeElement"] =
                    this.slider?.nativeElement;
                const sliderPercentage: number =
                    (100 * (this.rangeFormControl.value - this.minValue)) /
                    (this.maxValue - this.minValue);
                slider.style.setProperty(
                    "--pos-relative",
                    sliderPercentage.toString() + "%",
                );
            } else {
                const sanitizedValue = this.sanitizedSliderValue(
                    this.rangeFormControl.value,
                );
                if (!isNaN(sanitizedValue)) {
                    this.valueSanitized = true;
                    this.rangeFormControl.setValue(sanitizedValue);
                }
            }
        });
        this.rangeFormControl.setValue(this.rangeFormControl.value);
        console.log(this.sliderTicks?.nativeElement.height.baseVal.value);
        this.renderer.setStyle(this.slider!.nativeElement, 'width', `${this.sliderTicks?.nativeElement.height.baseVal.value}px`);
        // console.log(this.slider?.nativeElement
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

    sendEvent = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sliderEvent.emit(this.rangeFormControl.value);
        }, 100);
    };
}
