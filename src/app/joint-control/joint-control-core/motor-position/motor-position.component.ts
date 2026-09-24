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

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.motor = data["motor"];
                this.motorService
                    .getPositionObservable(this.motor.sourceMotorName)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((position) => {
                        this.positionReceiver$.next([
                            Math.floor(position / 100),
                        ]);
                    });
                this.motorService
                    .getSettingsObservable(this.motor.sourceMotorName)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((settings) => {
                        this.turnedOn = settings.turnedOn;
                        this.rotationRangeMin = Math.floor(
                            settings.rotationRangeMin / 100,
                        );
                        this.rotationRangeMax = Math.floor(
                            settings.rotationRangeMax / 100,
                        );
                    });
            });
    }

    setPosition(position: number) {
        this.motorService.setPosition(this.motor.motorName, position * 100);
    }
}
