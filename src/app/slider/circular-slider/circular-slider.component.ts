import {Component, ElementRef, Input, ViewChild} from "@angular/core";

@Component({
    selector: "app-circular-slider",
    templateUrl: "./circular-slider.component.html",
    styleUrls: ["./circular-slider.component.css"],
})
export class CircularSliderComponent {
    @ViewChild("canvas") canvas!: ElementRef;
    ctx: any;
    @Input()
    degree: number = 100;

    ngAfterViewInit(): void {
        this.drawGradientCircle(this.degree, 20);
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
        gradient.addColorStop(0, "green");
        gradient.addColorStop(0.5, "green");
        gradient.addColorStop(0.6, "blue");
        gradient.addColorStop(0.7, "orange");
        gradient.addColorStop(0.8, "red");
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
}
