import {
    Component,
    Input,
    OnInit,
    Output,
    EventEmitter,
    ElementRef,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {notNullValidator, steppingValidator} from "../shared/validators";

@Component({
    selector: "app-vertical-slider",
    templateUrl: "./vertical-slider.component.html",
    styleUrls: ["./vertical-slider.component.css"],
})
export class VerticalSliderComponent implements OnInit {
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
    @Input() step: number = 1;
    @Output() eventEmitter: EventEmitter<number> = new EventEmitter<number>();

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

    colorSliderTrack() {
        const slider: ElementRef["nativeElement"] = document.getElementById(
            this.name + "Slider",
        );
        const sliderPercentage: number =
            (this.rangeFormControl.value / this.maxValue) * 100;
        slider.style.setProperty(
            "--pos-relative",
            sliderPercentage.toString() + "%",
        );
    }
}
