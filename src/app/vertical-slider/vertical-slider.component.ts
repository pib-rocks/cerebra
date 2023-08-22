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
    @Input() parentFunction = () => {};
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
            const slider: ElementRef["nativeElement"] =
                this.slider?.nativeElement;
            const sliderPercentage: number =
                (this.rangeFormControl.value / this.maxValue) * 100;
            slider.style.setProperty(
                "--pos-relative",
                sliderPercentage.toString() + "%",
            );
        });
        this.rangeFormControl.setValue(this.rangeFormControl.value);
    }
}
