import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    Input,
    OnInit,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
    DiagnosticMotorFeedback,
    MotorService,
} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";

@Component({
    selector: "app-motor-feedback",
    templateUrl: "./motor-feedback.component.html",
    styleUrl: "./motor-feedback.component.scss",
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class MotorFeedbackComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    @Input() motor!: MotorConfiguration;
    @Input() feedback!: DiagnosticMotorFeedback;

    value?: string;

    constructor(
        private motorService: MotorService,
        private cdr: ChangeDetectorRef,
    ) {}

    get label(): string {
        return this.feedback === "temperature"
            ? "Temperature"
            : "Actual position";
    }

    ngOnInit(): void {
        this.motorService
            .getFeedbackObservable(this.motor.sourceMotorName, this.feedback)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.value = value;
                this.cdr.markForCheck();
            });
    }
}
