import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnInit,
    ViewChild,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {map} from "rxjs";
import {notNullValidator} from "src/app/shared/validators";

@Component({
    selector: "app-circular-slider",
    templateUrl: "./circular-slider.component.html",
    styleUrls: ["./circular-slider.component.css"],
})
export class CircularSliderComponent implements AfterViewInit, OnInit {
    @ViewChild("canvas") canvas!: ElementRef;
    ctx: any;
    @Input()
    @Input()
    initValue: number = 180;
    @Input() maxValue: number = 2000;
    @Input() minValue: number = 0;
    @Input() strokeWidth: number = 20;
    @Input() name?: string;
    mAFormControl: FormControl = new FormControl(0);

    ngOnInit(): void {
        this.mAFormControl.setValidators([
            Validators.min(this.minValue),
            Validators.max(this.maxValue),
            Validators.pattern("^[0-9]{1,}"),
            Validators.required,
            notNullValidator,
        ]);
        this.mAFormControl.valueChanges
            .pipe(map((x) => this.sanitize(x)))
            .subscribe((value) => {
                if (value) {
                    this.drawGradientCircle(
                        (value / this.maxValue) * 360,
                        this.strokeWidth,
                    );
                }
            });
    }

    ngAfterViewInit(): void {
        this.drawGradientCircle(this.initValue, this.strokeWidth);
    }
    drawGradientCircle(degree: number, strokeWidth: number) {
        const element = this.canvas.nativeElement;
        const width = element.getBoundingClientRect().width;
        const height = element.getBoundingClientRect().height;
        const radius = Math.min(width, height) / 2;
        this.ctx = element.getContext("2d")!;
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
        gradient.addColorStop(0, "#0094df");
        // gradient.addColorStop(0.25, "#0094df");
        gradient.addColorStop(0.4, "#8b1a76");
        gradient.addColorStop(0.8, "#e20072");
        gradient.addColorStop(1, "#e10072");
        // gradient.addColorStop(0, "#0094df");
        // gradient.addColorStop(0.25, "#8b1a76");
        // gradient.addColorStop(0.5, "#e20072");
        // gradient.addColorStop(0.75, "#0094df");
        // gradient.addColorStop(1, "#0094df");
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, -Math.PI / 2, endAngle - Math.PI / 2);
        this.ctx.lineWidth = strokewidth;
        this.ctx.strokeStyle = gradient;
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(200,200,200,0.3)";
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
    slide(event: any) {
        this.drawGradientCircle(
            Number((event.target as HTMLInputElement).value),
            30,
        );
    }

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
}
