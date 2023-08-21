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
import {Message} from "../shared/message";
import {MotorService} from "../shared/motor.service";
import {RosService} from "../shared/ros.service";
import {ModalDismissReasons, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    compareValuesDegreeValidator,
    compareValuesPulseValidator,
    notNullValidator,
} from "../shared/validators";
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
    messageReceiver$ = new Subject<Message>();
    allFingersSliderReceiver$ = new Subject<number>();
    motorFormControl: FormControl = new FormControl(true);
    sliderFormControl: FormControl = new FormControl(0);
    velocityFormControl: FormControl = new FormControl(0, notNullValidator);
    accelerationFormControl: FormControl = new FormControl(0);
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
                        this.sliderFormControl.setValue(
                            this.getValueWithinRange(Number(json.value)),
                        );
                        setTimeout(() => {
                            this.setThumbPosition();
                        }, 0);
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
                motor === "index_left_stretch"
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
                this.sliderFormControl.setValue(
                    this.getValueWithinRange(Number(value)),
                );
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
                this.degreeMaxFormcontrol.setValue(json.rotation_range_max);
            }
            if (json.rotation_range_min !== undefined) {
                this.degreeMinFormcontrol.setValue(json.rotation_range_min);
            }
            if (json.velocity !== undefined) {
                this.velocityFormControl.setValue(json.velocity);
            }
            this.setThumbPosition();
            this.setMinAndMaxBubblePositions();
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
                    this.inputSendMsg();
                } else if (this.bubbleFormControl.hasError("max")) {
                    this.setSliderValue(this.maxSliderValue);
                    this.inputSendMsg();
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
                    this.inputSendMsg();
                }
            }
        } else {
            this.isInputVisible = !this.isInputVisible;
        }
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
            this.degreeMaxFormcontrol.valid &&
            this.degreeMinFormcontrol.valid
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
                        rotation_range_min: this.degreeMinFormcontrol.value,
                        rotation_range_max: this.degreeMaxFormcontrol.value,
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
                    rotation_range_min: this.degreeMinFormcontrol.value,
                    rotation_range_max: this.degreeMaxFormcontrol.value,
                    velocity: this.velocityFormControl.value,
                    acceleration: this.accelerationFormControl.value,
                    deceleration: this.decelerationFormControl.value,
                    period: this.periodFormControl.value,
                };
                this.rosService.sendSliderMessage(message);
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

    imgSrc: string = "../../assets/mock_button.png";

    changeIcon() {
        if (this.imgSrc === "../../assets/mock_button.png") {
            this.imgSrc = "../../assets/mock_button2.png";
        } else {
            this.imgSrc = "../../assets/mock_button.png";
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
                        rotation_range_min: this.degreeMinFormcontrol.value,
                        rotation_range_max: this.degreeMaxFormcontrol.value,
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
                    rotation_range_min: this.degreeMinFormcontrol.value,
                    rotation_range_max: this.degreeMaxFormcontrol.value,
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

    inputSendMsg(): void {
        if (this.sliderFormControl.value !== null) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.sendMessage();
            }, 100);
        }
    }

    inputSendSettingsMsg = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.sendSettingMessage();
        }, 100);
    };

    colorSliderTrack(id: string) {
        const slider: ElementRef["nativeElement"] = document.getElementById(id);
        console.log(slider);
        console.log(slider.max);
        console.log(slider.value);
        const sliderValue: number = (slider.value / slider.max) * 100;
        slider.style.setProperty(
            "--pos-relative",
            sliderValue.toString() + "%",
        );
    }
}
