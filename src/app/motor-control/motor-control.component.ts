import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {Subject} from "rxjs";
import {MotorSettingsMessage} from "../shared/motorSettingsMessage";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    compareValuesDegreeValidator,
    compareValuesPulseValidator,
    notNullValidator,
} from "../shared/validators";
import {
    jointTrajectoryMessage,
    createEmptyJointTrajectoryMessage,
} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {createJointTrajectoryPoint} from "../shared/rosMessageTypes/jointTrajectoryPoint";
@Component({
    selector: "app-motor-control",
    templateUrl: "./motor-control.component.html",
    styleUrls: ["./motor-control.component.css"],
})
export class MotorControlComponent implements OnInit, AfterViewInit {
    maxSliderValue = 9000;
    minSliderValue = -9000;

    @Input() motorName = "";
    @Input() labelName = "";
    @Input() groupSide = "left";
    @Input() isGroup = false;
    @Input() showCheckBox = true;
    @Input() showMotorSettingsButton = true;

    closeResult!: string;
    @ViewChild("bubble") bubbleElement!: ElementRef;
    @ViewChild("range") sliderElem!: ElementRef;
    @ViewChild("bubbleInput") bubbleInput!: ElementRef;
    bubbleFormControl: FormControl = new FormControl(0);
    isInputVisible = false;

    isCombinedSlider = false;
    maxBubblePosition = 92;
    minBubblePosition = 8;
    // the number of pixels from the edges of the slider at which the gray bubbles disappear
    pixelsFromEdge = 60;
    motorSettingsMessageReceiver$ = new Subject<MotorSettingsMessage>();
    jointTrajectoryMessageReceiver$ = new Subject<jointTrajectoryMessage>();
    allFingersSliderReceiver$ = new Subject<number>();
    motorFormControl: FormControl = new FormControl(true);
    sliderFormControl: FormControl = new FormControl(0);
    velocityFormControl: FormControl = new FormControl(0, notNullValidator);
    accelerationFormControl: FormControl = new FormControl(0, notNullValidator);
    decelerationFormControl: FormControl = new FormControl(0, notNullValidator);
    periodFormControl: FormControl = new FormControl(1, notNullValidator);
    pulseMaxRange: FormControl = new FormControl(65535);
    pulseMinRange: FormControl = new FormControl(0);
    degreeMaxFormcontrol: FormControl = new FormControl(9000);
    degreeMinFormcontrol: FormControl = new FormControl(-9000);
    timer: any = null;
    bubblePosition!: number;

    constructor(
        private rosService: RosService,
        private motorService: MotorService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.bubbleFormControl.setValidators([
            Validators.min(-9000),
            Validators.max(9000),
            Validators.pattern("^-?[0-9]*$"),
            Validators.required,
            notNullValidator,
        ]);
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
        this.degreeMaxFormcontrol.setValidators([
            compareValuesDegreeValidator(
                this.degreeMinFormcontrol,
                this.degreeMaxFormcontrol,
            ),
            Validators.min(-9000),
            Validators.max(9000),
            notNullValidator,
        ]);
        this.degreeMinFormcontrol.setValidators([
            compareValuesDegreeValidator(
                this.degreeMinFormcontrol,
                this.degreeMaxFormcontrol,
            ),
            Validators.min(-9000),
            Validators.max(9000),
            notNullValidator,
        ]);
        this.isCombinedSlider =
            this.motorName === "all_right_stretch" ||
            this.motorName === "all_left_stretch";
        if (this.isCombinedSlider) {
            this.rosService.sharedMotorPosition$.subscribe((jtMessage) => {
                const jointName = jtMessage.joint_names[0];
                const position = jtMessage.points[0].positions[0];

                if (
                    (this.motorName === "all_left_stretch" &&
                        jointName === "index_left_stretch") ||
                    (this.motorName === "all_right_stretch" &&
                        jointName === "index_right_stretch")
                ) {
                    if (!Number.isNaN(position) && Number.isFinite(position)) {
                        this.sliderFormControl.setValue(
                            this.getValueWithinRange(Number(position)),
                        );
                        setTimeout(() => {
                            this.setThumbPosition();
                        }, 0);
                    }
                }
            });
        }
        if (this.isCombinedSlider) {
            this.rosService.sharedMotorSettings$.subscribe(
                (motorSettingMessage) => {
                    const jointName = motorSettingMessage.motor;

                    if (
                        (this.motorName === "all_left_stretch" &&
                            jointName === "index_left_stretch") ||
                        (this.motorName === "all_right_stretch" &&
                            jointName === "index_right_stretch")
                    ) {
                        if (motorSettingMessage.turnedOn !== undefined) {
                            this.motorFormControl.setValue(
                                motorSettingMessage.turnedOn,
                            );
                        }
                    }
                },
            );
        }
        this.motorSettingsMessageReceiver$.subscribe((motorSettingsMessage) => {
            const motorName = motorSettingsMessage.motor;

            if (motorSettingsMessage.turnedOn !== undefined) {
                this.motorFormControl.setValue(motorSettingsMessage.turnedOn);
            }
            if (motorSettingsMessage.acceleration !== undefined) {
                this.accelerationFormControl.setValue(
                    motorSettingsMessage.acceleration,
                );
            }
            if (motorSettingsMessage.deceleration !== undefined) {
                this.decelerationFormControl.setValue(
                    motorSettingsMessage.deceleration,
                );
            }
            if (motorSettingsMessage.period !== undefined) {
                this.periodFormControl.setValue(motorSettingsMessage.period);
            }
            if (motorSettingsMessage.pule_widths_max !== undefined) {
                this.pulseMaxRange.setValue(
                    motorSettingsMessage.pule_widths_max,
                );
            }
            if (motorSettingsMessage.pule_widths_min !== undefined) {
                this.pulseMinRange.setValue(
                    motorSettingsMessage.pule_widths_min,
                );
            }
            if (motorSettingsMessage.rotation_range_max !== undefined) {
                this.degreeMaxFormcontrol.setValue(
                    motorSettingsMessage.rotation_range_max,
                );
            }
            if (motorSettingsMessage.rotation_range_min !== undefined) {
                this.degreeMinFormcontrol.setValue(
                    motorSettingsMessage.rotation_range_min,
                );
            }
            if (motorSettingsMessage.velocity !== undefined) {
                this.velocityFormControl.setValue(
                    motorSettingsMessage.velocity,
                );
            }
            this.setThumbPosition();
            this.setMinAndMaxBubblePositions();
        });

        this.jointTrajectoryMessageReceiver$.subscribe((jtMessage) => {
            const position: number = jtMessage.points[0].positions[0];
            const motor_name = jtMessage.joint_names[0];
            const positionIsValid: boolean =
                position !== undefined &&
                !Number.isNaN(position) &&
                Number.isFinite(position);

            if (
                motor_name === "index_right_stretch" ||
                motor_name === "index_left_stretch"
            ) {
                if (positionIsValid) {
                    this.rosService.updateSharedMotorPosition(jtMessage);
                }
            }

            if (positionIsValid) {
                this.sliderFormControl.setValue(
                    this.getValueWithinRange(Number(position)),
                );
            }
        });

        this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
            if (isInitialized) {
                console.log("register " + this.motorName);
                this.rosService.registerMotor(
                    this.motorName,
                    this.motorSettingsMessageReceiver$,
                    this.jointTrajectoryMessageReceiver$,
                );
            }
        });
    }

    ngAfterViewInit() {
        this.setThumbPosition();
        this.setMinAndMaxBubblePositions();
    }

    setMinAndMaxBubblePositions() {
        const sliderWidth = document.getElementById("slider_" + this.motorName)
            ?.clientWidth;
        if (sliderWidth !== undefined && sliderWidth !== 0) {
            this.minBubblePosition = (this.pixelsFromEdge * 100) / sliderWidth;
            this.maxBubblePosition =
                ((sliderWidth - this.pixelsFromEdge) * 100) / sliderWidth;
        }
    }

    setThumbPosition() {
        const val = Number(
            ((this.sliderFormControl.value - -9000) * 100) / (9000 - -9000),
        );
        setTimeout(() => {
            this.bubblePosition = val;
        }, 0);
        this.bubbleFormControl.setValue(this.sliderFormControl.value);
        this.bubbleElement.nativeElement.style.left = `calc(${val}%)`;
        this.sliderElem.nativeElement.style.setProperty(
            "--pos-relative",
            val.toString(10) + "%",
        );
    }

    setSliderValue(value: number) {
        this.sliderFormControl.setValue(value);
        this.setThumbPosition();
    }

    toggleInputVisible() {
        if (this.sliderFormControl.value !== null) {
            this.isInputVisible = !this.isInputVisible;
            this.setSliderValue(this.bubbleFormControl.value);
            setTimeout(() => {
                this.bubbleInput.nativeElement.focus();
                this.bubbleInput.nativeElement.select();
            }, 0);
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    toggleInputUnvisible() {
        if (this.bubbleFormControl.value !== this.sliderFormControl.value) {
            if (this.sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (this.bubbleFormControl.hasError("min")) {
                    this.setSliderValue(this.minSliderValue);
                    this.inputSendJointTrajectoryMsg();
                    this.inputSendSettingsMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(this.maxSliderValue);
                    this.inputSendJointTrajectoryMsg();
                    this.inputSendSettingsMsg();
                } else if (this.bubbleFormControl.hasError("required")) {
                    this.bubbleFormControl.setValue(
                        this.sliderFormControl.value,
                    );
                } else if (this.bubbleFormControl.hasError("pattern")) {
                    this.bubbleFormControl.setValue(
                        this.sliderFormControl.value,
                    );
                } else {
                    this.setSliderValue(Number(this.bubbleFormControl.value));
                    this.inputSendJointTrajectoryMsg();
                    this.inputSendSettingsMsg();
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    sendJointTrajectoryMessage() {
        let motorNames: string[] = [];

        const jointTrajectoryMessage: jointTrajectoryMessage =
            createEmptyJointTrajectoryMessage();
        if (this.isCombinedSlider) {
            motorNames = this.motorService.getMotorHandNames(this.groupSide);

            for (const index in motorNames) {
                jointTrajectoryMessage.joint_names.push(motorNames[index]);
                jointTrajectoryMessage.points.push(
                    createJointTrajectoryPoint(this.sliderFormControl.value),
                );
            }
        } else {
            jointTrajectoryMessage.joint_names.push(this.motorName);
            jointTrajectoryMessage.points.push(
                createJointTrajectoryPoint(this.sliderFormControl.value),
            );
        }
        this.rosService.sendJointTrajectoryMessage(jointTrajectoryMessage);
    }

    checkValidity(): boolean {
        return (
            this.velocityFormControl.valid &&
            this.accelerationFormControl.valid &&
            this.decelerationFormControl.valid &&
            this.periodFormControl.valid &&
            this.pulseMaxRange.valid &&
            this.pulseMinRange.valid &&
            this.degreeMaxFormcontrol.valid &&
            this.degreeMinFormcontrol.valid
        );
    }

    sendMotorSettingsMessage() {
        if (this.checkValidity()) {
            let motorNames: string[] = [];
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: MotorSettingsMessage = {
                        motor: mn,
                        pule_widths_min: this.pulseMinRange.value,
                        pule_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormcontrol.value,
                        rotation_range_max: this.degreeMaxFormcontrol.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motor: this.motorName,
                    pule_widths_min: this.pulseMinRange.value,
                    pule_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormcontrol.value,
                    rotation_range_max: this.degreeMaxFormcontrol.value,
                    velocity: this.velocityFormControl.value,
                    acceleration: this.accelerationFormControl.value,
                    deceleration: this.decelerationFormControl.value,
                    period: this.periodFormControl.value,
                };
                this.rosService.sendMotorSettingsMessage(message);
            }
        }
    }

    getValueWithinRange(value: number) {
        let validVal;
        if (value > this.maxSliderValue) {
            validVal = this.maxSliderValue;
        } else if (value < this.minSliderValue) {
            validVal = this.minSliderValue;
        } else {
            validVal = value;
        }
        return validVal;
    }

    turnTheMotorOnAndOff() {
        let motorNames: string[] = [];
        if (this.isCombinedSlider) {
            motorNames = this.motorService.getMotorHandNames(this.groupSide);
            motorNames.forEach((mn) => {
                const message: MotorSettingsMessage = {
                    motor: mn,
                    turnedOn: this.motorFormControl.value,
                };
                this.rosService.sendMotorSettingsMessage(message);
            });
        } else {
            const message: MotorSettingsMessage = {
                motor: this.motorName,
                turnedOn: this.motorFormControl.value,
            };
            this.rosService.sendMotorSettingsMessage(message);
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
        // PR-203: Implement the currently missing JT-Handling for this method
        let motorNames: string[] = [];
        if (this.checkValidity()) {
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: MotorSettingsMessage = {
                        motor: mn,
                        turnedOn: this.motorFormControl.value,
                        pule_widths_min: this.pulseMinRange.value,
                        pule_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormcontrol.value,
                        rotation_range_max: this.degreeMaxFormcontrol.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motor: this.motorName,
                    turnedOn: this.motorFormControl.value,
                    pule_widths_min: this.pulseMinRange.value,
                    pule_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormcontrol.value,
                    rotation_range_max: this.degreeMaxFormcontrol.value,
                    velocity: this.velocityFormControl.value,
                    acceleration: this.accelerationFormControl.value,
                    deceleration: this.decelerationFormControl.value,
                    period: this.periodFormControl.value,
                };
                this.rosService.sendMotorSettingsMessage(message);
            }
        } else {
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: MotorSettingsMessage = {
                        motor: mn,
                        turnedOn: this.motorFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motor: this.motorName,
                    turnedOn: this.motorFormControl.value,
                };
                this.rosService.sendMotorSettingsMessage(message);
            }
        }
    }

    inputSendJointTrajectoryMsg(): void {
        if (this.sliderFormControl.value !== null) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.sendJointTrajectoryMessage();
            }, 100);
        }
    }

    inputSendSettingsMsg() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sendMotorSettingsMessage();
        }, 100);
    }
}
