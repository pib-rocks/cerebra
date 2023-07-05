import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { Message } from "../shared/message";
import { MotorService } from "../shared/motor.service";
import { RosService } from "../shared/ros.service";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
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

  @Input() motorName = "";
  @Input() labelName = "";
  @Input() groupSide = "left";
  @Input() isGroup = false;
  @Input() showCheckBox = true;
  @Input() showMotorSettingsButton = true;

  @ViewChild('bubble') bubbleElement!: ElementRef;
  @ViewChild('bubbleInput') bubbleInput!: ElementRef;
  @ViewChild('range') sliderElem!: ElementRef;

  bubblePosition!: number;
  closeResult!: string;
  isCombinedSlider = false;
  isInputVisible = false;
  maxSliderValue = 9000;
  minSliderValue = -9000;
  maxBubblePosition = 92;
  minBubblePosition = 8;
  // the number of pixels from the edges of the slider at which the gray bubbles disappear
  pixelsFromEdge = 60;
  messageReceiver$ = new Subject<Message>();
  oldValue: number = 0;
  timer: any = null;

  accelerationFormControl: FormControl = new FormControl(0, notNullValidator);
  bubbleFormControl: FormControl = new FormControl(0);
  decelerationFormControl: FormControl = new FormControl(0, notNullValidator);
  degreeMaxFormcontrol: FormControl = new FormControl(9000);
  degreeMinFormcontrol: FormControl = new FormControl(-9000);
  motorFormControl: FormControl = new FormControl(true);
  periodFormControl: FormControl = new FormControl(1, notNullValidator);
  pulseMaxRange: FormControl = new FormControl(65535);
  pulseMinRange: FormControl = new FormControl(0);
  sliderFormControl: FormControl = new FormControl(0);
  velocityFormControl: FormControl = new FormControl(0, notNullValidator);

  constructor(
    private rosService: RosService,
    private motorService: MotorService,
    private modalService: NgbModal
  ) { }

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
      compareValuesDegreeValidator(this.degreeMinFormcontrol, this.degreeMaxFormcontrol),
      Validators.min(-9000),
      Validators.max(9000),
      notNullValidator,
    ]);
    this.degreeMinFormcontrol.setValidators([
      compareValuesDegreeValidator(this.degreeMinFormcontrol, this.degreeMaxFormcontrol),
      Validators.min(-9000),
      Validators.max(9000),
      notNullValidator,
    ]);
    this.isCombinedSlider =
      this.isGroup && this.labelName === "Open/Close all fingers";

    this.messageReceiver$.subscribe((json) => {
      const value = json.value;

      if (value) {
        this.sliderFormControl.setValue(
          this.getValueWithinRange(Number(value))
        );
      }
      if (typeof json.turnedOn !== "undefined") {
        this.motorFormControl.setValue(json.turnedOn);
      }
      if (typeof json.acceleration !== "undefined") {
        this.accelerationFormControl.setValue(json.acceleration);
      }
      if (typeof json.deceleration !== "undefined") {
        this.decelerationFormControl.setValue(json.deceleration);
      }
      if (typeof json.period !== "undefined") {
        this.periodFormControl.setValue(json.period);
      }
      if (typeof json.pule_widths_max !== "undefined") {
        this.pulseMaxRange.setValue(json.pule_widths_max);
      }
      if (typeof json.pule_widths_min !== "undefined") {
        this.pulseMinRange.setValue(json.pule_widths_min);
      }
      if (typeof json.rotation_range_max !== "undefined") {
        this.degreeMaxFormcontrol.setValue(json.rotation_range_max);
      }
      if (typeof json.rotation_range_min !== "undefined") {
        this.degreeMinFormcontrol.setValue(json.rotation_range_min);
      }
      if (typeof json.velocity !== "undefined") {
        this.velocityFormControl.setValue(json.velocity);
      }
      this.setThumbPosition();
    });

    this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
      if (isInitialized) {
        console.log("register " + this.motorName);
        this.rosService.registerMotor(this.motorName, this.messageReceiver$);
      }
    });
  }

  ngAfterViewInit() {
    this.setThumbPosition();
    const sliderWidth = document.getElementById("slider_"+this.motorName)?.clientWidth;
    if (sliderWidth !== undefined) {
      this.minBubblePosition = this.pixelsFromEdge*100/sliderWidth;
      this.maxBubblePosition = (sliderWidth-this.pixelsFromEdge)*100/sliderWidth;
    }
  }

  setThumbPosition() {
    const val = Number((this.sliderFormControl.value - -9000) * 100 / (9000 - -9000));
    setTimeout(() => {
      this.bubblePosition = val;
    },0);
    this.bubbleFormControl.setValue(this.sliderFormControl.value);
    this.bubbleElement.nativeElement.style.left = `calc(${val}%)`;
    this.sliderElem.nativeElement.style.setProperty("--pos-relative", val.toString(10)+'%');
  }

  setSliderValue(value: number) {
    this.sliderFormControl.setValue(value);
    this.setThumbPosition();
  }
  
  toggleInputVisible() {
    if(this.sliderFormControl.value !== null){
      this.isInputVisible = !this.isInputVisible;
      this.setSliderValue(this.bubbleFormControl.value);
      setTimeout(()=>{
        this.bubbleInput.nativeElement.focus();
        this.bubbleInput.nativeElement.select();
      }, 0)
    } else{
      this.isInputVisible = !this.isInputVisible;
    }
  }

  toggleInputUnvisible() {

    console.log("sliderFormControl", this.sliderFormControl.value);
    console.log("bubbleFormControl", this.bubbleFormControl.value);

    console.log("dirty", this.bubbleFormControl.dirty);

    if (this.bubbleFormControl.value !== this.sliderFormControl.value) {
      if(this.sliderFormControl.value !== null){
        this.isInputVisible = !this.isInputVisible;
        if(this.bubbleFormControl.hasError('min')) {
          this.setSliderValue(this.minSliderValue);
          this.inputSendMsg();
        }
        else if(this.bubbleFormControl.hasError('max')) {
          this.setSliderValue(this.maxSliderValue);
          this.inputSendMsg();
        }
        else if(this.bubbleFormControl.hasError('required')) {
          this.bubbleFormControl.setValue(this.sliderFormControl.value);
        }
        else if(this.bubbleFormControl.hasError('pattern')) {
          this.bubbleFormControl.setValue(this.sliderFormControl.value);
        }
        else {
          this.setSliderValue(this.bubbleFormControl.value);
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
        motorNames = this.motorService.getMotorHandNames(this.groupSide);
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

  openPopup(content: TemplateRef<any>) {
    this.modalService
      .open(content, { ariaLabelledBy: "modal-basic-title", size: "xl" , windowClass: 'myCustomModalClass',backdropClass: 'myCustomBackdropClass'})
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          console.log(this.closeResult);
        }
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
        motorNames = this.motorService.getMotorHandNames(this.groupSide);
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
        motorNames = this.motorService.getMotorHandNames(this.groupSide);
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
    if(this.sliderFormControl.value !== null){
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.sendMessage();
      }, 500);
    }
  }

  inputSendSettingsMsg() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.sendSettingMessage();
    }, 500);
  }
}
