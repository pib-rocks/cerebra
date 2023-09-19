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
import {Subject, map} from "rxjs";
import {MotorSettingsMessage} from "../shared/motorSettingsMessage";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    compareValuesDegreeValidator,
    compareValuesPulseValidator,
    notNullValidator,
} from "../shared/validators";
import {JointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
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
    jointTrajectoryMessageReceiver$ = new Subject<JointTrajectoryMessage>();

    pulseWidthSubject$ = new Subject<number[]>();
    degreeSubject$ = new Subject<number[]>();
    periodSubject$ = new Subject<number>();

    allFingersSliderReceiver$ = new Subject<number>();
    motorFormControl: FormControl = new FormControl(true);
    sliderFormControl: FormControl = new FormControl(0);
    velocityFormControl: FormControl = new FormControl(0, notNullValidator);
    accelerationFormControl: FormControl = new FormControl(0);
    decelerationFormControl: FormControl = new FormControl(0, notNullValidator);
    periodFormControl: FormControl = new FormControl(1, notNullValidator);
    pulseMaxRange: FormControl = new FormControl(65535);
    pulseMinRange: FormControl = new FormControl(0);
    degreeMaxFormControl: FormControl = new FormControl(9000);
    degreeMinFormControl: FormControl = new FormControl(-9000);
    timer: any = null;
    bubblePosition!: number;
    imgSrc: string = "../../assets/toggle-switch-left.png";

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
        //  Sinn? Will ich wirklich allFinger mit Index synchen und wenn ja warum? Wenn schon gegeben sollten wir das mit Anastasiia/Nina/Jürgen
        // if (this.isCombinedSlider) {
        //     this.rosService.sharedMotorPosition$.subscribe((jtMessage) => {
        //         const jointName = jtMessage.joint_names[0];
        //         const position = jtMessage.points[0].positions[0];
        //         if (
        //             (this.motorName === "all_left_stretch" &&
        //                 jointName === "index_left_stretch") ||
        //             (this.motorName === "all_right_stretch" &&
        //                 jointName === "index_right_stretch")
        //         ) {
        //             if (!Number.isNaN(position) && Number.isFinite(position)) {
        //                 this.sliderFormControl.setValue(
        //                     this.getValueWithinRange(Number(position)),
        //                 );
        //                 setTimeout(() => {
        //                     this.setThumbPosition();
        //                 }, 0);
        //             }
        //         }
        //     });
        // }
        // if (this.isCombinedSlider) {
        //     this.rosService.sharedMotorSettings$.subscribe(
        //         (motorSettingMessage) => {
        //             const jointName = motorSettingMessage.motor;

        //             if (
        //                 (this.motorName === "all_left_stretch" &&
        //                     jointName === "index_left_stretch") ||
        //                 (this.motorName === "all_right_stretch" &&
        //                     jointName === "index_right_stretch")
        //             ) {
        //                 if (motorSettingMessage.turnedOn !== undefined) {
        //                     this.motorFormControl.setValue(
        //                         motorSettingMessage.turnedOn,
        //                     );
        //                 }
        //             }
        //         },
        //     );
        // }
        this.motorSettingsMessageReceiver$.subscribe((motorSettingsMessage) => {
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
            if (motorSettingsMessage.pulse_widths_max !== undefined) {
                this.pulseMaxRange.setValue(
                    motorSettingsMessage.pulse_widths_max,
                );
            }
            if (motorSettingsMessage.pulse_widths_min !== undefined) {
                this.pulseMinRange.setValue(
                    motorSettingsMessage.pulse_widths_min,
                );
            }
            if (motorSettingsMessage.rotation_range_max !== undefined) {
                this.degreeMaxFormControl.setValue(
                    motorSettingsMessage.rotation_range_max,
                );
            }
            if (motorSettingsMessage.rotation_range_min !== undefined) {
                this.degreeMinFormControl.setValue(
                    motorSettingsMessage.rotation_range_min,
                );
            }
            if (motorSettingsMessage.velocity !== undefined) {
                this.velocityFormControl.setValue(
                    motorSettingsMessage.velocity,
                );
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

        this.jointTrajectoryMessageReceiver$
            .pipe(
                map((jtMessage) => {
                    const index = jtMessage.joint_names.indexOf(this.motorName);
                    if (index === -1) {
                        return {};
                    } else {
                        const name = jtMessage.joint_names[index];
                        const position = jtMessage.points[index].positions[0];
                        return {name: name, position: position};
                    }
                }),
            )
            .subscribe((object: {name?: string; position?: number}) => {
                const position = object["position"];
                const positionIsValid: boolean =
                    position !== undefined &&
                    !Number.isNaN(position) &&
                    Number.isFinite(position);

                if (positionIsValid) {
                    this.sliderFormControl.setValue(
                        this.getValueWithinRange(Number(position)),
                    );
                    this.setThumbPosition();
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

    toggleInputInvisible() {
        if (this.bubbleFormControl.value !== this.sliderFormControl.value) {
            if (this.sliderFormControl.value !== null) {
                this.isInputVisible = !this.isInputVisible;
                if (this.bubbleFormControl.hasError("min")) {
                    this.setSliderValue(this.minSliderValue);
                    this.inputSendJointTrajectoryMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(this.maxSliderValue);
                    this.inputSendJointTrajectoryMsg();
                } else if (
                    this.bubbleFormControl.hasError("required") ||
                    this.bubbleFormControl.hasError("pattern")
                ) {
                    this.bubbleFormControl.setValue(
                        this.sliderFormControl.value,
                    );
                } else {
                    this.setSliderValue(Number(this.bubbleFormControl.value));
                    this.inputSendJointTrajectoryMsg();
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
    }

    sendJointTrajectoryMessage() {
        let motorNames: string[] = [];

        const jointTrajectoryMessage: JointTrajectoryMessage =
            this.rosService.createEmptyJointTrajectoryMessage();
        if (this.isCombinedSlider) {
            motorNames = this.motorService.getMotorHandNames(this.groupSide);
            for (const index in motorNames) {
                jointTrajectoryMessage.joint_names.push(motorNames[index]);
                jointTrajectoryMessage.points.push(
                    this.rosService.createJointTrajectoryPoint(
                        this.sliderFormControl.value,
                    ),
                );
            }
        } else {
            jointTrajectoryMessage.joint_names.push(this.motorName);
            jointTrajectoryMessage.points.push(
                this.rosService.createJointTrajectoryPoint(
                    this.sliderFormControl.value,
                ),
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
            this.degreeMaxFormControl.valid &&
            this.degreeMinFormControl.valid
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
                        motorName: mn,
                        pulse_widths_min: this.pulseMinRange.value,
                        pulse_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormControl.value,
                        rotation_range_max: this.degreeMaxFormControl.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motorName: this.motorName,
                    pulse_widths_min: this.pulseMinRange.value,
                    pulse_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormControl.value,
                    rotation_range_max: this.degreeMaxFormControl.value,
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
                    motorName: mn,
                    turnedOn: this.motorFormControl.value,
                };
                this.rosService.sendMotorSettingsMessage(message);
            });
        } else {
            const message: MotorSettingsMessage = {
                motorName: this.motorName,
                turnedOn: this.motorFormControl.value,
            };
            this.rosService.sendMotorSettingsMessage(message);
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
        // PR-203: Implement the currently missing JT-Handling for this method
        let motorNames: string[] = [];
        if (this.checkValidity()) {
            if (this.isCombinedSlider) {
                motorNames = this.motorService.getMotorHandNames(
                    this.groupSide,
                );
                motorNames.forEach((mn) => {
                    const message: MotorSettingsMessage = {
                        motorName: mn,
                        turnedOn: this.motorFormControl.value,
                        pulse_widths_min: this.pulseMinRange.value,
                        pulse_widths_max: this.pulseMaxRange.value,
                        rotation_range_min: this.degreeMinFormControl.value,
                        rotation_range_max: this.degreeMaxFormControl.value,
                        velocity: this.velocityFormControl.value,
                        acceleration: this.accelerationFormControl.value,
                        deceleration: this.decelerationFormControl.value,
                        period: this.periodFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motorName: this.motorName,
                    turnedOn: this.motorFormControl.value,
                    pulse_widths_min: this.pulseMinRange.value,
                    pulse_widths_max: this.pulseMaxRange.value,
                    rotation_range_min: this.degreeMinFormControl.value,
                    rotation_range_max: this.degreeMaxFormControl.value,
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
                        motorName: mn,
                        turnedOn: this.motorFormControl.value,
                    };
                    this.rosService.sendMotorSettingsMessage(message);
                });
            } else {
                const message: MotorSettingsMessage = {
                    motorName: this.motorName,
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

    inputSendSettingsMsg = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sendMotorSettingsMessage();
        }, 100);
    };

    setPulseRanges(number: number[]) {
        this.pulseMinRange.setValue(number[0]);
        this.pulseMaxRange.setValue(number[1]);
        this.sendMotorSettingsMessage();
    }
    setDegree(number: number[]) {
        this.degreeMinFormControl.setValue(number[0]);
        this.degreeMaxFormControl.setValue(number[1]);
        this.sendMotorSettingsMessage();
    }
    setPeriod(number: number) {
        this.periodFormControl.setValue(number);
        this.sendMotorSettingsMessage();
    }
}
