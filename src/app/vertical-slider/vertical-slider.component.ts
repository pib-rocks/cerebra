import {
    Component,
    Input,
    OnInit,
    ElementRef,
    ViewChild,
    AfterViewInit,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {notNullValidator, steppingValidator} from "../shared/validators";

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
    @Input() rangeFormControl: FormControl = new FormControl();
    @Input() name?: string;
    @Input() showPrompt: boolean = true;
    @Input() showTextInput: boolean = true;
    @Input() parentFunction = () => {
        console.warn("no Parentfunction passed to component");
    };
    @Input() id = "";
    //Slider
    @ViewChild("slider") slider?: ElementRef;
    @Input() step: number = 1;

    ngOnInit(): void {
        this.rangeFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^[0-9]{1,}"),
            Validators.required,
            notNullValidator,
            steppingValidator(this.step),
        ]);
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
}
