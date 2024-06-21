import {Component, Input, TemplateRef} from "@angular/core";
import {FormControl} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject, map} from "rxjs";
import {MotorService} from "src/app/shared/services/motor.service";
import {MotorConfiguration} from "src/app/shared/types/motor-configuration";
import {MotorSettings} from "src/app/shared/types/motor-settings.class";

@Component({
    selector: "app-motor-settings",
    templateUrl: "./motor-settings.component.html",
    styleUrls: ["./motor-settings.component.scss"],
})
export class MotorSettingsComponent {
    @Input() motor!: MotorConfiguration;
    @Input() reversed!: boolean;

    pulseWidthSubject$ = new BehaviorSubject<number[]>([]);
    degreeSubject$ = new BehaviorSubject<number[]>([]);
    periodSubject$ = new BehaviorSubject<number[]>([]);
    decelerationSubject$ = new BehaviorSubject<number>(NaN);
    accelerationSubject$ = new BehaviorSubject<number>(NaN);
    velocitySubject$ = new BehaviorSubject<number>(NaN);
    positionSubject$ = new BehaviorSubject<number[]>([]);

    turnedOnFormControl: FormControl = new FormControl(true);
    invertFormControl: FormControl = new FormControl(false);

    settings!: MotorSettings;

    displayExtended: boolean = false;

    constructor(
        private motorService: MotorService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.motorService
            .getSettingsObservable(this.motor.sourceMotorName)
            .pipe(map((settings) => structuredClone(settings)))
            .subscribe((settings) => {
                this.settings = settings;
                this.pulseWidthSubject$.next([
                    settings.pulseWidthMin,
                    settings.pulseWidthMax,
                ]);
                this.degreeSubject$.next([
                    Math.floor(settings.rotationRangeMin / 100),
                    Math.floor(settings.rotationRangeMax / 100),
                ]);
                this.periodSubject$.next([settings.period]);
                this.decelerationSubject$.next(settings.deceleration);
                this.accelerationSubject$.next(settings.acceleration);
                this.velocitySubject$.next(settings.velocity);
                this.turnedOnFormControl.setValue(this.settings.turnedOn);
                this.invertFormControl.setValue(this.settings.invert);
            });
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

    setInvert() {
        this.settings.invert = !this.invertFormControl.value;
        this.motorService.applySettings(this.motor.motorName, this.settings);
    }
}
