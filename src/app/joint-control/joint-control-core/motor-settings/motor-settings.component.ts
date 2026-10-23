import {
    Component,
    Input,
    ViewChild,
    TemplateRef,
    ChangeDetectionStrategy,
    OnInit,
    DestroyRef,
    ChangeDetectorRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject, map} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {
    MotorSettings,
    resolveUpperEndpoint,
} from "src/app/shared/types/motor-settings.class";
import {MotorUpperEndpoint} from "src/app/shared/types/motor-dto";
import {NgClass} from "@angular/common";
import {HorizontalSliderComponent} from "../../../sliders/horizontal-slider/horizontal-slider.component";
import {VerticalSliderComponent} from "../../../sliders/vertical-slider/vertical-slider.component";
import {VariantService} from "src/app/shared/services/variant.service";
import {MotorFeedbackComponent} from "../motor-feedback/motor-feedback.component";

@Component({
    selector: "app-motor-settings",
    templateUrl: "./motor-settings.component.html",
    styleUrls: ["./motor-settings.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        NgClass,
        ReactiveFormsModule,
        HorizontalSliderComponent,
        VerticalSliderComponent,
        MotorFeedbackComponent,
    ],
})
export class MotorSettingsComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    private readonly ENDPOINT_LABELS: Array<{
        match: RegExp;
        first: string;
        second: string;
    }> = [
        {
            match: /^(turn_head_motor|tilt_forward_motor|shoulder_vertical_(left|right))$/,
            first: "Oben",
            second: "Unten",
        },
        {
            match: /^shoulder_horizontal_(left|right)$/,
            first: "Vorne",
            second: "Hinten",
        },
        {
            match: /^upper_arm_.*_rotation$/,
            first: "Einwärts",
            second: "Auswärts",
        },
        {
            match: /^elbow_(left|right)$/,
            first: "Beugen",
            second: "Strecken",
        },
        {
            match: /^lower_arm_.*_rotation$/,
            first: "Links",
            second: "Rechts",
        },
        {
            match: /^wrist_(left|right)$/,
            first: "Neigen oben",
            second: "Neigen unten",
        },
        {
            match: /^thumb_.*_opposition$/,
            first: "Einwärts",
            second: "Auswärts",
        },
        {match: /_stretch$/, first: "Offen", second: "Geschlossen"},
    ];

    @Input() motor!: MotorConfiguration;
    @Input() reversed!: boolean;

    @ViewChild("content", {read: TemplateRef})
    content!: TemplateRef<unknown>;

    pulseWidthSubject$ = new BehaviorSubject<number[]>([]);
    degreeSubject$ = new BehaviorSubject<number[]>([]);
    periodSubject$ = new BehaviorSubject<number[]>([]);
    decelerationSubject$ = new BehaviorSubject<number>(NaN);
    accelerationSubject$ = new BehaviorSubject<number>(NaN);
    velocitySubject$ = new BehaviorSubject<number>(NaN);
    positionSubject$ = new BehaviorSubject<number[]>([]);

    turnedOnFormControl: FormControl = new FormControl(true);
    upperEndpointFormControl = new FormControl<MotorUpperEndpoint>("max");

    settings!: MotorSettings;
    actualPosition = 0;

    displayExtended: boolean = false;
    showActualPosition = false;
    showTemperature = false;
    showPulseWidth = true;
    showPeriod = true;
    showDeceleration = true;
    showZeroCalibration = false;
    showEndpointMapping = true;
    showCurrentPositionButtons = false;

    constructor(
        private motorService: MotorService,
        private modalService: NgbModal,
        private variantService: VariantService,
    ) {}

    get endpointLabels(): {first: string; second: string} {
        const labels = this.ENDPOINT_LABELS.find(({match}) =>
            match.test(this.motor.motorName),
        );
        return labels
            ? {first: labels.first, second: labels.second}
            : {first: "Oben", second: "Unten"};
    }

    /** The two bounds the dropdown offers, in ascending order. */
    get endpointValues(): number[] {
        return [this.settings.rotationRangeMin, this.settings.rotationRangeMax];
    }

    get firstEndpointValue(): number {
        return this.settings.upperEndpoint === "max"
            ? this.settings.rotationRangeMax
            : this.settings.rotationRangeMin;
    }

    get secondEndpointValue(): number {
        return this.settings.upperEndpoint === "max"
            ? this.settings.rotationRangeMin
            : this.settings.rotationRangeMax;
    }

    ngOnInit(): void {
        this.motorService
            .getSettingsObservable(this.motor.sourceMotorName)
            .pipe(
                map((settings) => structuredClone(settings)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((settings) => {
                this.settings = settings;
                this.pulseWidthSubject$.next([
                    settings.pulseWidthMin,
                    settings.pulseWidthMax,
                ]);
                this.emitDegreeSubject();
                this.periodSubject$.next([settings.period]);
                this.decelerationSubject$.next(settings.deceleration);
                this.accelerationSubject$.next(settings.acceleration);
                this.velocitySubject$.next(settings.velocity);
                this.turnedOnFormControl.setValue(this.settings.turnedOn);
                this.upperEndpointFormControl.setValue(
                    resolveUpperEndpoint(settings),
                    {emitEvent: false},
                );
                this.cdr.markForCheck();
            });
        this.motorService
            .getFeedbackObservable(
                this.motor.sourceMotorName,
                "actual_position",
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                const parsed = value !== undefined ? Number(value) : Number.NaN;
                this.actualPosition = Number.isFinite(parsed)
                    ? Math.round(parsed * 100)
                    : 0;
                this.cdr.markForCheck();
            });
        this.variantService
            .hasFeedback("actual_position")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((available) => {
                this.showActualPosition = available;
                this.cdr.markForCheck();
            });
        this.variantService
            .hasFeedback("temperature")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((available) => {
                this.showTemperature = available;
                this.cdr.markForCheck();
            });
        if (
            typeof this.variantService.getInstalledControllerKinds ===
            "function"
        ) {
            this.variantService
                .getInstalledControllerKinds()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((kinds) => {
                    this.showCurrentPositionButtons =
                        kinds.includes("feetech_st_serial");
                    this.cdr.markForCheck();
                });
        }

        if (typeof this.variantService.hasMeaningfulSetting === "function") {
            this.variantService
                .hasMeaningfulSetting("pulse_width")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((available) => {
                    this.showPulseWidth = available;
                    this.cdr.markForCheck();
                });
            this.variantService
                .hasMeaningfulSetting("period")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((available) => {
                    this.showPeriod = available;
                    this.cdr.markForCheck();
                });
            this.variantService
                .hasMeaningfulSetting("deceleration")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((available) => {
                    this.showDeceleration = available;
                    this.cdr.markForCheck();
                });
            this.variantService
                .hasMeaningfulSetting("zero_calibration")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((available) => {
                    this.showZeroCalibration = available;
                    this.cdr.markForCheck();
                });
            this.variantService
                .hasMeaningfulSetting("endpoint_mapping")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((available) => {
                    this.showEndpointMapping = available;
                    this.cdr.markForCheck();
                });
        }
    }

    openPopup(content: TemplateRef<any>) {
        this.modalService.open(content, {
            ariaLabelledBy: "modal-basic-title",
            size: "xl",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
    }

    setPulseRanges(number: number[]) {
        this.settings.pulseWidthMin = number[0];
        this.settings.pulseWidthMax = number[1];
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setDegree(number: number[]) {
        this.settings.rotationRangeMin = number[0] * 100;
        this.settings.rotationRangeMax = number[1] * 100;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setPeriod(number: number) {
        this.settings.period = number;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setDeceleration(number: number) {
        this.settings.deceleration = number;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setAcceleration(number: number) {
        this.settings.acceleration = number;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setVelocity(number: number) {
        this.settings.velocity = number;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setTurnedOn() {
        this.settings.turnedOn = !this.turnedOnFormControl.value;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }

    setUpperEndpoint(value: MotorUpperEndpoint): void {
        this.settings.upperEndpoint = value;
        this.upperEndpointFormControl.setValue(value, {emitEvent: false});
        this.motorService.applySettings(this.motor.motorName, this.settings);
        this.cdr.markForCheck();
    }

    setFirstEndpointToCurrentPosition(): void {
        if (this.settings.upperEndpoint === "max") {
            this.settings.rotationRangeMax = this.actualPosition;
        } else {
            this.settings.rotationRangeMin = this.actualPosition;
        }
        this.emitDegreeSubject();
        this.motorService.applySettings(this.motor.motorName, this.settings);
        this.cdr.markForCheck();
    }

    setSecondEndpointToCurrentPosition(): void {
        if (this.settings.upperEndpoint === "max") {
            this.settings.rotationRangeMin = this.actualPosition;
        } else {
            this.settings.rotationRangeMax = this.actualPosition;
        }
        this.emitDegreeSubject();
        this.motorService.applySettings(this.motor.motorName, this.settings);
        this.cdr.markForCheck();
    }

    setCurrentPositionAsZero(): void {
        this.motorService.calibrateZero(this.motor.motorName);
    }

    private emitDegreeSubject(): void {
        this.degreeSubject$.next([
            Math.floor(this.settings.rotationRangeMin / 100),
            Math.floor(this.settings.rotationRangeMax / 100),
        ]);
    }
}
