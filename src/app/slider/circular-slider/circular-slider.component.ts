import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnInit,
    ViewChild,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {Subscription, map} from "rxjs";
import {MotorCurrentService} from "src/app/shared/motor-current.mock.service";
import {notNullValidator} from "src/app/shared/validators";

@Component({
    selector: "app-circular-slider",
    templateUrl: "./circular-slider.component.html",
    styleUrls: ["./circular-slider.component.css"],
})
export class CircularSliderComponent implements AfterViewInit, OnInit {
    @ViewChild("canvas") canvas!: ElementRef;
    @ViewChild("numberdisplay") paragraph!: ElementRef;
    ctx: any;
    @Input() initValue: number = 1000;
    @Input() maxValue: number = 2000;
    @Input() minValue: number = 0;
    @Input() strokeWidth: number = 20;
    @Input() name?: string;
    @Input() initHeight!: number;
    @Input() initWidth!: number;
    currentValue?: number;
    mAFormControl: FormControl = new FormControl(0);

    motorSubscription?: Subscription;

    constructor(private motorCurrentService: MotorCurrentService) {}

    ngOnInit(): void {
        this.mAFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^[0-9]{1,}"),
            Validators.required,
            notNullValidator,
        ]);
    }

    ngAfterViewInit(): void {
        this.motorSubscription = this.motorCurrentService
            .getMotorSubjectByName(this.name)
            ?.subscribe((value: number) => {
                console.log(
                    "received Motormessage for: " +
                        this.name +
                        "\t Current: " +
                        value,
                );
                this.currentValue = value;
                this.drawGradientCircle(
                    this.percentage(value),
                    this.strokeWidth,
                );
            });
        this.drawGradientCircle(
            this.percentage(this.initValue),
            this.strokeWidth,
        );
        this.currentValue = this.initValue ? this.initValue : 0;
    }
    drawGradientCircle(degree: number, strokeWidth: number) {
        const element = this.canvas.nativeElement;
        const width = element.width;
        const height = element.height;
        const radius = Math.min(width, height) / 2;
        this.ctx = element.getContext("2d");
        this.ctx.clearRect(0, 0, element.width, element.height);
        this.drawGradientArc(
            radius,
            radius,
            radius - strokeWidth,
            (degree * Math.PI) / 180,
            strokeWidth,
        );
    }

    drawGradientArc(
        cx: number,
        cy: number,
        r: number,
        endAngle: number,
        strokewidth: number,
    ) {
        const gradient = this.ctx.createConicGradient(
            -Math.PI / 2,
            r + strokewidth,
            r + strokewidth,
        );
        gradient.addColorStop(0, "rgba(0, 148, 223, 1)");
        gradient.addColorStop(0.4, "rgba(139, 26, 118, 1)");
        gradient.addColorStop(0.8, "rgba(226, 0, 114, 1)");
        gradient.addColorStop(1, "rgba(225, 0, 114, 1)");

        this.ctx.beginPath();

        this.ctx.arc(cx, cy, r, -Math.PI / 2, endAngle - Math.PI / 2);
        this.ctx.lineWidth = strokewidth;
        this.ctx.strokeStyle = gradient;
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(200,200,200, 0.3)";
        this.ctx.arc(
            cx,
            cy,
            r,
            endAngle - Math.PI / 2,
            2 * Math.PI - Math.PI / 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.arc(
            cx,
            cy,
            r - strokewidth / 2,
            -Math.PI / 2,
            2 * Math.PI - Math.PI / 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.arc(
            cx,
            cy,
            r + strokewidth / 2,
            -Math.PI / 2,
            2 * Math.PI - Math.PI / 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
    }
    // slide(event: any) {
    //     this.drawGradientCircle(
    //         Number((event.target as HTMLInputElement).value),
    //         30,
    //     );
    // }

    sanitize(value: number) {
        if (this.mAFormControl.hasError("required")) {
            return null;
        }
        if (this.mAFormControl.hasError("pattern")) {
            return null;
        }
        if (this.mAFormControl.hasError("nullValue")) {
            return null;
        }
        if (this.mAFormControl.hasError("min")) {
            return this.minValue;
        }
        if (this.mAFormControl.hasError("max")) {
            return this.maxValue;
        }
        return value;
    }

    percentage(number: number): number {
        return (number / this.maxValue) * 360;
    }
}
