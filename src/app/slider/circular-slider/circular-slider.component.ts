import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
} from "@angular/core";
import {Subscription} from "rxjs";
import {MotorCurrentService} from "src/app/shared/motor-current.service";

@Component({
    selector: "app-circular-slider",
    templateUrl: "./circular-slider.component.html",
    styleUrls: ["./circular-slider.component.css"],
})
export class CircularSliderComponent implements AfterViewInit, OnDestroy {
    @ViewChild("numberdisplay") paragraph!: ElementRef;
    @ViewChild("gradientCircle") gradientCircle!: ElementRef;

    @Input() initValue: number = 1000;
    @Input() maxValue: number = 2000;
    @Input() minValue: number = 0;
    @Input() name?: string;

    @Input() radius: number = 30;
    @Input() strokeWidth: number = 12;
    @Input() borderStrokeWidth: number = this.strokeWidth
        ? this.strokeWidth / 8
        : 0.33;
    CIRCUMFERENCE: number = 2 * Math.PI * this.radius;
    currentValue: number = 0;
    motorSubscription?: Subscription;

    constructor(
        private motorCurrentService: MotorCurrentService,
        private renderer: Renderer2,
    ) {}

    ngAfterViewInit(): void {
        this.motorSubscription = this.motorCurrentService
            .getMotorSubjectByName(this.name)
            ?.subscribe((value: number) => {
                this.currentValue = value;
                this.renderer.setStyle(
                    this.gradientCircle.nativeElement,
                    "strokeDasharray",
                    (Number(this.percentage(value)) * this.CIRCUMFERENCE) /
                        100 +
                        ", 360",
                );
            });
    }

    ngOnDestroy(): void {
        this.motorSubscription?.unsubscribe();
    }

    percentage(number: number): number {
        return (number / this.maxValue) * 100;
    }
}
