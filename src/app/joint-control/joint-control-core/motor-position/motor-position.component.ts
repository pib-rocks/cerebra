import {Component, Input, OnInit} from "@angular/core";
import {Observable, Subject} from "rxjs";
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

    constructor(
        private motorService: MotorService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.motor = this.route.snapshot.data["motor"];
        this.route.data.subscribe((data) => {
            this.motor = data["motor"];
            this.motorService
                .getPositionObservable(this.motor.motorName)
                .subscribe((position) =>
                    this.positionReceiver$.next([position]),
                );
        });
    }

    applyPosition(position: number) {
        this.motorService.applyPosition(this.motor.motorName, position);
    }
}
