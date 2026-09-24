import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {JointConfiguration} from "../../shared/types/joint-configuration";
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {NgClass} from "@angular/common";
import {MotorSettingsComponent} from "./motor-settings/motor-settings.component";
import {MotorCurrentComponent} from "./motor-current/motor-current.component";
import {MotorFeedbackComponent} from "./motor-feedback/motor-feedback.component";
import {VariantService} from "src/app/shared/services/variant.service";

@Component({
    selector: "app-joint-control-core",
    templateUrl: "./joint-control-core.component.html",
    styleUrls: ["./joint-control-core.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        NgClass,
        MotorSettingsComponent,
        MotorCurrentComponent,
        MotorFeedbackComponent,
        RouterOutlet,
    ],
})
export class JointControlCoreComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    joint!: JointConfiguration;
    selectedMotor!: any;
    displayMotors: MotorConfiguration[] = [];
    showActualPosition = false;
    showTemperature = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private variantService: VariantService,
    ) {}

    get primaryColumnClass(): string {
        const feedbackCount =
            Number(this.showActualPosition) + Number(this.showTemperature);
        return feedbackCount === 2
            ? "col-4"
            : feedbackCount === 1
            ? "col-5"
            : "col-6";
    }

    ngOnInit(): void {
        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.joint = data["joint"];
                this.displayMotors = [];
                this.selectedMotor = undefined;
                this.displayMotors = this.joint.motors.filter(
                    (motor) => !motor.isMultiMotor,
                );
            });
        this.variantService
            .hasFeedback("actual_position")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((available) => (this.showActualPosition = available));
        this.variantService
            .hasFeedback("temperature")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((available) => (this.showTemperature = available));
    }

    selectMotor(motor: any) {
        this.router.navigate(["motor", motor.motorPathName], {
            relativeTo: this.route,
        });
        this.selectedMotor = motor;
    }
}
