import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {Subject, map} from "rxjs";
import {MotorSettingsMessage} from "../shared/motorSettingsMessage";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {JointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {SliderComponent} from "../slider/slider.component";
import {Motor} from "../shared/types/motor.class";
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
    isCombinedSlider = false;

    motorSettingsMessageReceiver$ = new Subject<MotorSettingsMessage>();
    jointTrajectoryMessageReceiver$ = new Subject<JointTrajectoryMessage>();

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
        this.motor!.motorSubject.subscribe((motor) => {
            console.log(motor.toString());
            this.motor = motor;
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
                    console.log(this.closeResult);
                },
            );
    }

    private getDismissReason(reason: any): string {
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
        this.motor.settings.pulse_width_min = number[0];
        this.motor.settings.pulse_width_max = number[1];
        this.motorService.updateMotorFromComponent(this.motor);
    }
    setDegree(number: number[]) {
        this.motor.settings.rotation_range_min = number[0];
        this.motor.settings.rotation_range_max = number[1];
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
