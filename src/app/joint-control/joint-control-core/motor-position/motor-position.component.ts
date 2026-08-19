import {Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "../../../shared/types/motor-configuration";
import {ActivatedRoute} from "@angular/router";
import {CollisionJointLimits} from "../../../shared/types/collision-joint-limits";

@Component({
    selector: "app-motor-position",
    templateUrl: "./motor-position.component.html",
    styleUrls: ["./motor-position.component.scss"],
})
export class MotorPositionComponent implements OnInit, OnDestroy {
    motor!: MotorConfiguration;

    positionReceiver$: BehaviorSubject<[number]> = new BehaviorSubject([0]);

    rotationRangeMin: number = -90;
    rotationRangeMax: number = +90;
    private configuredRangeMin: number = -90;
    private configuredRangeMax: number = +90;
    private collisionLimits: CollisionJointLimits | null = null;
    private collisionLimitTimer: ReturnType<typeof setTimeout> | null = null;
    private routeSubscription = new Subscription();
    private motorSubscriptions = new Subscription();

    turnedOn: boolean = false;
    sliderRangeAvailable: boolean = true;

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.routeSubscription = this.route.data.subscribe((data) => {
            this.motorSubscriptions.unsubscribe();
            this.motorSubscriptions = new Subscription();
            if (this.collisionLimitTimer) {
                clearTimeout(this.collisionLimitTimer);
            }
            this.motor = data["motor"];
            this.collisionLimits = null;
            this.motorSubscriptions.add(
                this.motorService
                    .getPositionObservable(this.motor.sourceMotorName)
                    .subscribe((position) => {
                        this.positionReceiver$.next([
                            Math.round(position / 100),
                        ]);
                        this.scheduleCollisionLimitRefresh(1000);
                    }),
            );
            this.motorSubscriptions.add(
                this.motorService
                    .getSettingsObservable(this.motor.sourceMotorName)
                    .subscribe((settings) => {
                        this.turnedOn = settings.turnedOn;
                        this.configuredRangeMin = Math.ceil(
                            settings.rotationRangeMin / 100,
                        );
                        this.configuredRangeMax = Math.floor(
                            settings.rotationRangeMax / 100,
                        );
                        this.applySliderRange();
                        this.scheduleCollisionLimitRefresh();
                    }),
            );
            this.motorSubscriptions.add(
                this.motorService
                    .getCollisionLimitsObservable(
                        this.motor.sourceMotorName,
                    )
                    .subscribe((limits) => {
                        this.collisionLimits = limits;
                        this.applySliderRange();
                    }),
            );
            this.scheduleCollisionLimitRefresh();
        });
    }

    setPosition(position: number) {
        this.motorService.setPosition(this.motor.motorName, position * 100);
    }

    ngOnDestroy(): void {
        if (this.collisionLimitTimer) {
            clearTimeout(this.collisionLimitTimer);
        }
        this.motorSubscriptions.unsubscribe();
        this.routeSubscription.unsubscribe();
    }

    private scheduleCollisionLimitRefresh(delay = 150): void {
        if (!this.motor) return;
        if (this.collisionLimitTimer) {
            clearTimeout(this.collisionLimitTimer);
        }
        this.collisionLimitTimer = setTimeout(
            () =>
                this.motorService.requestCollisionLimits(
                    this.motor.sourceMotorName,
                ),
            delay,
        );
    }

    private applySliderRange(): void {
        let minimum = this.configuredRangeMin;
        let maximum = this.configuredRangeMax;
        if (this.collisionLimits) {
            minimum = Math.max(
                minimum,
                Math.ceil(this.collisionLimits.minimum / 100),
            );
            maximum = Math.min(
                maximum,
                Math.floor(this.collisionLimits.maximum / 100),
            );
        }
        this.sliderRangeAvailable = minimum < maximum;
        if (!this.sliderRangeAvailable) {
            maximum = minimum;
        }
        this.rotationRangeMin = minimum;
        this.rotationRangeMax = maximum;
    }
}
