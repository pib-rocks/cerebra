import {
    Component,
    ElementRef,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Motor} from "../../shared/types/motor.class";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";
@Component({
    selector: "app-motor-control",
    templateUrl: "./motor-control.component.html",
    styleUrls: ["./motor-control.component.css"],
})
export class MotorControlComponent implements OnInit {
    @Input() showCheckBox = true;
    @Input() showMotorSettingsButton = true;
    @Input() motor!: Motor;
    @ViewChild(HorizontalSliderComponent)
    sliderComponent!: HorizontalSliderComponent;

    rotationRangeMin!: number;
    rotationRangeMax!: number;
    closeResult!: string;

    pulseWidthSubject$ = new BehaviorSubject<number[]>([]);
    degreeSubject$ = new BehaviorSubject<number[]>([]);
    periodSubject$ = new BehaviorSubject<number[]>([]);
    decelerationSubject$ = new BehaviorSubject<number>(NaN);
    accelerationSubject$ = new BehaviorSubject<number>(NaN);
    velocitySubject$ = new BehaviorSubject<number>(NaN);
    positionSubject$ = new BehaviorSubject<number[]>([]);
    invertSubject$ = new BehaviorSubject<boolean>(false);

    motorFormControl: FormControl = new FormControl(true);

    imgSrc: string = "../../assets/toggle-switch-left.png";

    constructor(
        private motorService: MotorService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.motor.motorSubject.subscribe((motor) => {
            this.motor = motor;
            this.rotationRangeMax = Math.floor(
                motor.settings.rotationRangeMax / 100,
            );
            this.rotationRangeMin = Math.floor(
                motor.settings.rotationRangeMin / 100,
            );
            this.pulseWidthSubject$.next([
                this.motor.settings.pulseWidthMin,
                this.motor.settings.pulseWidthMax,
            ]);
            this.degreeSubject$.next([
                this.motor.settings.rotationRangeMin / 100,
                this.motor.settings.rotationRangeMax / 100,
            ]);
            this.accelerationSubject$.next(this.motor.settings.acceleration);
            this.decelerationSubject$.next(this.motor.settings.deceleration);
            this.velocitySubject$.next(this.motor.settings.velocity);
            this.positionSubject$.next([this.motor.position / 100]);

            this.motorFormControl.setValue(this.motor.settings.turnedOn);
            this.periodSubject$.next([this.motor.settings.period]);
            this.invertSubject$.next(this.motor.settings.invert);
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
        this.motor.position = number * 100;
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setPulseRanges(number: number[]) {
        this.motor.settings.pulseWidthMin = number[0];
        this.motor.settings.pulseWidthMax = number[1];
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setDegree(number: number[]) {
        this.motor.settings.rotationRangeMin = number[0] * 100;
        this.motor.settings.rotationRangeMax = number[1] * 100;
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
    setInverteState() {
        this.motor.settings.invert = !this.motor.settings.invert;
        this.motorService.updateMotorFromComponent(this.motor);
    }
}
