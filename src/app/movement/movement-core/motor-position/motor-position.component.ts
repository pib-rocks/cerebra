import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {BehaviorSubject} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "../../../shared/types/motor-configuration";
import {ActivatedRoute} from "@angular/router";
import {HorizontalSliderComponent} from "../../../sliders/horizontal-slider/horizontal-slider.component";

@Component({
    selector: "app-motor-position",
    templateUrl: "./motor-position.component.html",
    styleUrls: ["./motor-position.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [HorizontalSliderComponent],
})
export class MotorPositionComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    motor!: MotorConfiguration;

    positionReceiver$: BehaviorSubject<[number]> = new BehaviorSubject([0]);

    rotationRangeMin: number = -90;
    rotationRangeMax: number = +90;

    turnedOn: boolean = false;

    /**
     * The slider is the master of the motor: the first measured value seeds it, everything after
     * that is ignored. Feeding live positions back made the thumb run after the robot and jump
     * between Soll and Ist while dragging.
     */
    private seedFromMeasurement = true;

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.motor = data["motor"];
                this.seedFromMeasurement = true;
                this.motorService
                    .getPositionObservable(this.motor.sourceMotorName)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((position) => {
                        if (!this.seedFromMeasurement) return;
                        this.seedFromMeasurement = false;
                        this.positionReceiver$.next([position / 100]);
                    });
                this.motorService.refreshPosition(this.motor.sourceMotorName);
                this.motorService
                    .getSettingsObservable(this.motor.sourceMotorName)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((settings) => {
                        this.turnedOn = settings.turnedOn;
                        this.rotationRangeMin = settings.rotationRangeMin / 100;
                        this.rotationRangeMax = settings.rotationRangeMax / 100;
                    });
            });
    }

    setPosition(position: number) {
        this.seedFromMeasurement = false;
        this.motorService.setPosition(this.motor.motorName, position * 100);
    }
}
