import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {Subject} from "rxjs";
import {Message} from "../shared/message";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    compareValuesDegreeValidator,
    compareValuesPulseValidator,
    notNullValidator,
} from "../shared/validators";
import {SliderComponent} from "../slider/slider.component";
@Component({
    selector: "app-motor-control",
    templateUrl: "./motor-control.component.html",
    styleUrls: ["./motor-control.component.css"],
})
export class MotorControlComponent implements OnInit {
    @Input() motorName = "";
    @Input() labelName = "";
    @Input() groupSide = "left";
    @Input() isGroup = false;
    @Input() showCheckBox = true;
    @Input() showMotorSettingsButton = true;

    @ViewChild(SliderComponent) sliderComponent!: SliderComponent;

    closeResult!: string;
    isCombinedSlider = false;

    messageReceiver$ = new Subject<Message>();

    pulseWidthSubject$ = new Subject<number[]>();
    degreeSubject$ = new Subject<number[]>();
    periodSubject$ = new Subject<number>();

    sliderFormControl: FormControl = new FormControl(0);
    motorFormControl: FormControl = new FormControl(true);
    velocityFormControl: FormControl = new FormControl(0, notNullValidator);
    accelerationFormControl: FormControl = new FormControl(0);
    decelerationFormControl: FormControl = new FormControl(0, notNullValidator);
    periodFormControl: FormControl = new FormControl(1, notNullValidator);
    pulseMaxRange: FormControl = new FormControl(65535);
    pulseMinRange: FormControl = new FormControl(0);
    degreeMaxFormControl: FormControl = new FormControl(9000);
    degreeMinFormControl: FormControl = new FormControl(-9000);
    timer: any = null;
    imgSrc: string = "../../assets/toggle-switch-left.png";

    constructor(
        private rosService: RosService,
        private motorService: MotorService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.pulseMaxRange.setValidators([
            Validators.min(0),
            Validators.max(65535),
            compareValuesPulseValidator(this.pulseMinRange, this.pulseMaxRange),
            notNullValidator,
        ]);
        this.pulseMinRange.setValidators([
            Validators.min(0),
            Validators.max(65535),
            compareValuesPulseValidator(this.pulseMinRange, this.pulseMaxRange),
            notNullValidator,
        ]);
        this.degreeMaxFormControl.setValidators([
            compareValuesDegreeValidator(
                this.degreeMinFormControl,
                this.degreeMaxFormControl,
            ),
            Validators.min(-9000),
            Validators.max(9000),
            notNullValidator,
        ]);
        this.degreeMinFormControl.setValidators([
            compareValuesDegreeValidator(
                this.degreeMinFormControl,
                this.degreeMaxFormControl,
            ),
            Validators.min(-9000),
            Validators.max(9000),
            notNullValidator,
        ]);
        this.isCombinedSlider =
            this.motorName === "all_right_stretch" ||
            this.motorName === "all_left_stretch";
        if (this.isCombinedSlider) {
            this.rosService.sharedValue$.subscribe((json) => {
                if (
                    (this.motorName === "all_left_stretch" &&
                        json.motor === "index_left_stretch") ||
                    (this.motorName === "all_right_stretch" &&
                        json.motor === "index_right_stretch")
                ) {
                    if (
                        !Number.isNaN(json.value) &&
                        Number.isFinite(json.value)
                    ) {
                        this.sliderFormControl.setValue(Number(json.value));
                    }
                    if (json.turnedOn !== undefined) {
                        this.motorFormControl.setValue(json.turnedOn);
                    }
                }
            });
        }
        this.messageReceiver$.subscribe((json) => {
            const value: any = json.value;
            const motorCheckbox = json.turnedOn;
            const motor = json.motor;
            const message: Message = {
                motor: this.motorName,
                value: value,
            };
            if (
                motor === "index_right_stretch" ||
                motor === "index_left_stretch" ||
                motor === "all_left_stretch" ||
                motor === "all_right_stretch"
            ) {
                if (!Number.isNaN(value) && Number.isFinite(value)) {
                    if (json.turnedOn) {
                        message.turnedOn = motorCheckbox;
                    }
                    this.rosService.updateSharedValue(message);
                }
                message.turnedOn = json.turnedOn;
                this.rosService.updateSharedValue(message);
            }

            if (value !== undefined) {
                this.sliderFormControl.setValue(Number(json.value));
            }

            if (json.turnedOn !== undefined) {
                this.motorFormControl.setValue(json.turnedOn);
            }
            if (json.acceleration !== undefined) {
                this.accelerationFormControl.setValue(json.acceleration);
            }
            if (json.deceleration !== undefined) {
                this.decelerationFormControl.setValue(json.deceleration);
            }
            if (json.period !== undefined) {
                this.periodFormControl.setValue(json.period);
            }
            if (json.pule_widths_max !== undefined) {
                this.pulseMaxRange.setValue(json.pule_widths_max);
            }
            if (json.pule_widths_min !== undefined) {
                this.pulseMinRange.setValue(json.pule_widths_min);
            }
            if (json.rotation_range_max !== undefined) {
                this.degreeMaxFormControl.setValue(json.rotation_range_max);
            }
            if (json.rotation_range_min !== undefined) {
                this.degreeMinFormControl.setValue(json.rotation_range_min);
            }
            if (json.velocity !== undefined) {
                this.velocityFormControl.setValue(json.velocity);
            }
            this.degreeSubject$.next([
                Number(this.degreeMinFormControl.value),
                Number(this.degreeMaxFormControl.value),
            ]);
            this.pulseWidthSubject$.next([
                Number(this.pulseMinRange.value),
                Number(this.pulseMaxRange.value),
            ]);
            this.periodSubject$.next(Number(this.periodFormControl.value));
        });

        this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
            if (isInitialized) {
                console.log("register " + this.motorName);
                this.rosService.registerMotor(
                    this.motorName,
                    this.messageReceiver$,
                );
            }
        });
    }

    sendMessage() {
        let motorNames: string[] = [];
        if (this.isCombinedSlider) {
            motorNames = this.motorService.getMotorHandNames(this.groupSide);

            motorNames.forEach((mn) => {
                const message: Message = {
                    motor: mn,
                    value: this.sliderFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
            });
        } else {
            const message: Message = {
                motor: this.motorName,
                value: this.sliderFormControl.value,
            };
            this.rosService.sendSliderMessage(message);
        }
    }

    checkValidity(): boolean {
        return (
            this.velocityFormControl.valid &&
            this.accelerationFormControl.valid &&
            this.decelerationFormControl.valid &&
            this.periodFormControl.valid &&
            this.pulseMaxRange.valid &&
            this.pulseMinRange.valid &&
            this.degreeMaxFormControl.valid &&
            this.degreeMinFormControl.valid
        );
    }

    sendSettingMessage() {
        if (this.checkValidity()) {
            let motorNames: string[] = [];
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: Message = {
                        motor: mn,
                        pule_widths_min: this.pulseMinRange.value,
                        pule_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormControl.value,
                        rotation_range_max: this.degreeMaxFormControl.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendSliderMessage(message);
                });
            } else {
                const message: Message = {
                    motor: this.motorName,
                    pule_widths_min: this.pulseMinRange.value,
                    pule_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormControl.value,
                    rotation_range_max: this.degreeMaxFormControl.value,
                    velocity: this.velocityFormControl.value,
                    acceleration: this.accelerationFormControl.value,
                    deceleration: this.decelerationFormControl.value,
                    period: this.periodFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
            }
        }
    }

    turnTheMotorOnAndOff() {
        let motorNames: string[] = [];
        if (this.isCombinedSlider) {
            motorNames = this.motorService.getMotorHandNames(this.groupSide);
            motorNames.forEach((mn) => {
                const message: Message = {
                    motor: mn,
                    turnedOn: this.motorFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
            });
        } else {
            const message: Message = {
                motor: this.motorName,
                turnedOn: this.motorFormControl.value,
            };
            this.rosService.sendSliderMessage(message);
        }
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

    sendAllMessagesCombined() {
        let motorNames: string[] = [];
        if (this.checkValidity()) {
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: Message = {
                        motor: mn,
                        value: this.sliderFormControl.value,
                        turnedOn: this.motorFormControl.value,
                        pule_widths_min: this.pulseMinRange.value,
                        pule_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormControl.value,
                        rotation_range_max: this.degreeMaxFormControl.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendSliderMessage(message);
                });
            } else {
                const message: Message = {
                    motor: this.motorName,
                    value: this.sliderFormControl.value,
                    turnedOn: this.motorFormControl.value,
                    pule_widths_min: this.pulseMinRange.value,
                    pule_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormControl.value,
                    rotation_range_max: this.degreeMaxFormControl.value,
                    velocity: this.velocityFormControl.value,
                    acceleration: this.accelerationFormControl.value,
                    deceleration: this.decelerationFormControl.value,
                    period: this.periodFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
            }
        } else {
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: Message = {
                        motor: mn,
                        value: this.sliderFormControl.value,
                        turnedOn: this.motorFormControl.value,
                    };
                    this.rosService.sendSliderMessage(message);
                });
            } else {
                const message: Message = {
                    motor: this.motorName,
                    value: this.sliderFormControl.value,
                    turnedOn: this.motorFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
            }
        }
    }

    inputSendSettingsMsg = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sendSettingMessage();
        }, 100);
    };

    setSliderValue(value: number) {
        this.sliderFormControl.setValue(value);
    }
    setMotorPositionValue = (value: number) => {
        this.sliderFormControl.setValue(value);
        this.sendMessage();
    };

    setPulseRanges(number: number[]) {
        this.pulseMinRange.setValue(number[0]);
        this.pulseMaxRange.setValue(number[1]);
        this.sendSettingMessage();
    }
    setDegree(number: number[]) {
        this.degreeMinFormControl.setValue(number[0]);
        this.degreeMaxFormControl.setValue(number[1]);
        this.sendSettingMessage();
    }
    setPeriod(number: number) {
        this.periodFormControl.setValue(number);
        this.sendSettingMessage();
    }
}
