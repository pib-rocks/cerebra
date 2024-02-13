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

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe((data) => {
            this.motor = data["motor"];
            this.motorService
                .getPositionObservable(this.motor.motorName)
                .subscribe((position) => {
                    this.positionReceiver$.next([position]);
                });
            this.motorService
                .getSettingsObservable(this.motor.motorName)
                .subscribe((settings) => {
                    this.turnedOnReceiver$.next(settings.turnedOn);
                });
        });
    }

    setPosition(position: number) {
        this.motorService.setPosition(this.motor.motorName, position);
    }
}
