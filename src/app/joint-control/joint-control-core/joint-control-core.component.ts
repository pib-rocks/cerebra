import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from "@angular/core";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute} from "@angular/router";
import {MotorConfiguration} from "../../shared/types/motor-configuration";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.css"],
})
export class JointControlCoreComponent implements OnInit, AfterViewInit {
    joint!: JointConfiguration;

    readonly touchpointUnselected =
        "assets/joint-control/background/touchpoint_unselected.svg";
    readonly touchpointSelected =
        "assets/joint-control/background/touchpoint_selected.svg";

    observer!: ResizeObserver;
    @ViewChild("canvas") jointCanvas!: ElementRef<HTMLDivElement>;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.joint = data["joint"];
        });

        this.observer = new ResizeObserver(() => {
            // TODO
        });
    }

    ngAfterViewInit() {
        this.observer.observe(this.jointCanvas.nativeElement);
    }

    f() {
        console.info("f");
    }
}
