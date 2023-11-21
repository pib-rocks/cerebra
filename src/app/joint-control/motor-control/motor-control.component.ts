import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Subject} from "rxjs";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SliderComponent} from "../../sliders/slider/slider.component";
import {Motor} from "../../shared/types/motor.class";
@Component({
    selector: "app-motor-control",
    templateUrl: "./motor-control.component.html",
    styleUrls: ["./motor-control.component.css"],
})
export class MotorControlComponent implements OnInit {
    @Input() showCheckBox = true;
    @Input() showMotorSettingsButton = true;
    @Input() motor!: Motor;

    @ViewChild(SliderComponent) sliderComponent!: SliderComponent;

    closeResult!: string;

    pulseWidthSubject$ = new Subject<number[]>();
    degreeSubject$ = new Subject<number[]>();
    periodSubject$ = new Subject<number>();
    accelerationSubject$ = new Subject<number>();
    decelerationSubject$ = new Subject<number>();
    velocitySubject$ = new Subject<number>();
    positionSubject$ = new Subject<number>();

    motorFormControl: FormControl = new FormControl(true);

    imgSrc: string = "../../assets/toggle-switch-left.png";

    constructor(
        private motorService: MotorService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.motor.motorSubject.subscribe((motor) => {
            this.motor = motor;
            this.pulseWidthSubject$.next([
                this.motor.settings.pulseWidthMin,
                this.motor.settings.pulseWidthMax,
            ]);
            this.degreeSubject$.next([
                this.motor.settings.rotationRangeMin,
                this.motor.settings.rotationRangeMax,
            ]);
            this.accelerationSubject$.next(this.motor.settings.acceleration);
            this.decelerationSubject$.next(this.motor.settings.deceleration);
            this.velocitySubject$.next(this.motor.settings.velocity);
            this.positionSubject$.next(this.motor.position);
            this.motorFormControl.setValue(this.motor.settings.turnedOn);
            this.periodSubject$.next(this.motor.settings.period);
        });

        this.motorFormControl.valueChanges.subscribe(() => {
            this.motor.settings.turnedOn = this.motorFormControl.value;
            this.motorService.updateMotorFromComponent(this.motor);
        });
    }
    changeIcon() {
        if (this.imgSrc === "../../assets/toggle-switch-left.png") {
            this.imgSrc = "../../assets/toggle-switch-right.png";
        } else {
            this.imgSrc = "../../assets/toggle-switch-left.png";
        }
    }
    openPopup(content: TemplateRef<any>) {
        this.modalService
            .open(content, {
                ariaLabelledBy: "modal-basic-title",
                size: "xl",
                windowClass: "myCustomModalClass",
                backdropClass: "myCustomBackdropClass",
            })
            .result.then(
                (result) => {
                    this.closeResult = `Closed with: ${result}`;
                },
                (reason) => {
                    this.closeResult = `Dismissed ${this.getDismissReason(
                        reason,
                    )}`;
                },
            );
    }
    getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return "by pressing ESC";
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return "by clicking on a backdrop";
        } else {
            return `with: ${reason}`;
        }
    }
    setMotorPositionValue(number: number) {
        this.motor.position = number;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setPulseRanges(number: number[]) {
        this.motor.settings.pulseWidthMin = number[0];
        this.motor.settings.pulseWidthMax = number[1];
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setDegree(number: number[]) {
        this.motor.settings.rotationRangeMin = number[0];
        this.motor.settings.rotationRangeMax = number[1];
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setPeriod(number: number) {
        this.motor.settings.period = number;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setDeceleration(number: number) {
        this.motor.settings.deceleration = number;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setAcceleration(number: number) {
        this.motor.settings.acceleration = number;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setVelocity(number: number) {
        this.motor.settings.velocity = number;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    changeTurnedOn() {
        this.motor.settings.turnedOn = !this.motor.settings.turnedOn;
        this.motorService.updateMotorFromComponent(this.motor);
    }
}
