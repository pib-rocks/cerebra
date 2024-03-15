import {Component, OnInit} from "@angular/core";
import {Subject} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "../../../shared/types/motor-configuration";
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: "app-motor-position",
    templateUrl: "./motor-position.component.html",
    styleUrls: ["./motor-position.component.css"],
})
export class MotorPositionComponent implements OnInit {
    motor!: MotorConfiguration;

    positionReceiver$: Subject<[number]> = new Subject();
    turnedOnReceiver$: Subject<boolean> = new Subject();

    rotationRangeMin: number = -90;
    rotationRangeMax: number = +90;

    turnedOn: boolean = false;

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.motor = data["motor"];
            this.motorService
                .getPositionObservable(this.motor.sourceMotorName)
                .subscribe((position) => {
                    this.positionReceiver$.next([position]);
                });
            this.motorService
                .getSettingsObservable(this.motor.sourceMotorName)
                .subscribe((settings) => {
                    this.turnedOn = settings.turnedOn;
                    this.rotationRangeMin = settings.rotationRangeMin;
                    this.rotationRangeMax = settings.rotationRangeMax;
                });
        });
    }

    setPosition(position: number) {
        this.motorService.setPosition(this.motor.motorName, position);
    }
}
