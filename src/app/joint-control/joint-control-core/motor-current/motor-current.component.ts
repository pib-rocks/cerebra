import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    Renderer2,
    ViewChild,
} from "@angular/core";
import {Subscription} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";

@Component({
    selector: "app-motor-current",
    templateUrl: "./motor-current.component.html",
    styleUrls: ["./motor-current.component.css"],
})
export class MotorCurrentComponent implements AfterViewInit, OnDestroy {
    @Input() motorName!: string;
    @Input() reversed!: boolean;

    @ViewChild("numberdisplay") paragraph!: ElementRef;
    @ViewChild("gradientCircle") gradientCircle!: ElementRef;

    @Input() initValue: number = 1000;
    @Input() maxValue: number = 2000;
    @Input() minValue: number = 0;

    @Input() radius: number = 30;
    @Input() strokeWidth: number = 12;
    @Input() borderStrokeWidth: number = this.strokeWidth
        ? this.strokeWidth / 8
        : 0.33;

    CIRCUMFERENCE: number = 2 * Math.PI * this.radius;
    currentValue: number = 0;
    subscription?: Subscription;

    constructor(
        private motorService: MotorService,
        private renderer: Renderer2,
    ) {}

    ngAfterViewInit(): void {
        this.subscription = this.motorService
            .getCurrentObservable(this.motorName)
            .subscribe((value: number) => {
                console.info("component received current: " + value);
                this.currentValue = value;
                this.renderer.setStyle(
                    this.gradientCircle.nativeElement,
                    "strokeDasharray",
                    `${
                        (value / (this.maxValue - this.minValue)) *
                        this.CIRCUMFERENCE
                    }, 360`,
                );
            });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
