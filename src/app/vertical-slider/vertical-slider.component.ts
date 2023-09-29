import {
    Component,
    Input,
    OnInit,
    ElementRef,
    ViewChild,
    AfterViewInit,
    EventEmitter,
    Output,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {notNullValidator, steppingValidator} from "../shared/validators";
import {Observable} from "rxjs";

@Component({
    selector: "app-vertical-slider",
    templateUrl: "./vertical-slider.component.html",
    styleUrls: ["./vertical-slider.component.css"],
})
export class VerticalSliderComponent implements OnInit, AfterViewInit {
    //Shared
    @Input() defaultValue: number = 0;
    @Input() maxValue: number = 100;
    @Input() minValue: number = 0;
    @Input() name?: string;
    @Input() showPrompt: boolean = true;
    @Input() showTextInput: boolean = true;
    @Input() parentFunction?: Function;
    @Input() unitShort?: string;
    @Input() unitLong?: string;
    @Input() id = "";
    @Input() messageReceiver$!: Observable<any>;
    //Slider
    @ViewChild("slider") slider?: ElementRef;
    @Input() step: number = 1;

    @Output() sliderEvent = new EventEmitter<number>();

    timer: any;
    rangeFormControl: FormControl = new FormControl();

    ngOnInit(): void {
        this.rangeFormControl.setValue(this.defaultValue);
        this.rangeFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^[0-9]{1,}"),
            Validators.required,
            notNullValidator,
            steppingValidator(this.step),
        ]);
        this.messageReceiver$.subscribe((value: number) => {
            this.rangeFormControl.setValue(value);
        });
    }
    ngAfterViewInit(): void {
        this.rangeFormControl.valueChanges.subscribe((value) => {
            if (this.sanitizeValue()) {
                const slider: ElementRef["nativeElement"] =
                    this.slider?.nativeElement;
                const sliderPercentage: number =
                    (this.rangeFormControl.value / this.maxValue) * 100;
                slider.style.setProperty(
                    "--pos-relative",
                    sliderPercentage.toString() + "%",
                );
            }
        });
        this.rangeFormControl.setValue(this.rangeFormControl.value);
    }

    sanitizeValue() {
        if (this.rangeFormControl.hasError("required")) {
            this.rangeFormControl.setValue(0);
        } else if (this.rangeFormControl.hasError("pattern")) {
            this.rangeFormControl.setValue(0);
        } else if (this.rangeFormControl.hasError("min")) {
            this.rangeFormControl.setValue(this.minValue);
        } else if (this.rangeFormControl.hasError("max")) {
            this.rangeFormControl.setValue(this.maxValue);
        } else if (this.rangeFormControl.hasError("steppingError")) {
            let intFormControl = Math.floor(this.rangeFormControl.value * 1000);
            const moduloValue = intFormControl % Math.floor(this.step * 1000);
            intFormControl -= moduloValue;
            intFormControl /= 1000;
            this.rangeFormControl.setValue(intFormControl);
        } else {
            return true;
        }
        return false;
    }

    inputSendMsg = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sliderEvent.emit(this.rangeFormControl.value);
            if (this.parentFunction) {
                this.parentFunction();
            }
        }, 100);
    };
}
