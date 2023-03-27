import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { Message } from '../shared/message';
import { MotorService } from '../shared/motor.service';
import { RosService } from '../shared/ros.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { compareValuesDegreeValidator, compareValuesPulseValidator, notNullValidator } from '../shared/validators';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  maxSliderValue = 9000;
  minSliderValue = -9000;

  value: number = 300;
  @Input() motorName = '';
  @Input() labelName = '';
  @Input() groupSide = 'left';
  @Input() isGroup = false;

  closeResult!: string;

  isCombinedSlider = false;
  messageReceiver$ = new Subject<Message>();

  motorFormControl: FormControl = new FormControl(true);
  sliderFormControl: FormControl = new FormControl(0);
  velocityFormControl: FormControl = new FormControl(0, notNullValidator);
  accelerationFormControl: FormControl = new FormControl(0, notNullValidator);
  decelerationFormControl: FormControl = new FormControl(0, notNullValidator);
  periodFormControl: FormControl = new FormControl(1, notNullValidator);
  pulseMaxRange: FormControl = new FormControl(65535);
  pulseMinRange: FormControl = new FormControl(0);
  degreeMax: FormControl = new FormControl(9000);
  degreeMin: FormControl = new FormControl(-9000);
  timer: any = null;



  constructor(private rosService: RosService, private motorService: MotorService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.pulseMaxRange.setValidators([Validators.min(0), Validators.max(65535), compareValuesPulseValidator(this.pulseMinRange, this.pulseMaxRange), notNullValidator]);
    this.pulseMinRange.setValidators([Validators.min(0), Validators.max(65535), compareValuesPulseValidator(this.pulseMinRange, this.pulseMaxRange), notNullValidator]);
    this.degreeMax.setValidators([compareValuesDegreeValidator(this.degreeMin, this.degreeMax), Validators.min(-9000), Validators.max(9000), notNullValidator]);
    this.degreeMin.setValidators([compareValuesDegreeValidator(this.degreeMin, this.degreeMax), Validators.min(-9000), Validators.max(9000), notNullValidator]);
    this.isCombinedSlider = this.isGroup && this.labelName === "Open/Close all fingers";

    this.messageReceiver$.subscribe(json => {
      const value = json.value;

      if (value) {
        this.sliderFormControl.setValue(this.getValueWithinRange(Number(value)));
      }
      if ((typeof json.turnedOn !== 'undefined')) {
        this.motorFormControl.setValue(json.turnedOn);
      }
      if ((typeof json.acceleration !== 'undefined')) {
        this.accelerationFormControl.setValue(json.acceleration);
      }
      if ((typeof json.deceleration !== 'undefined')) {
        this.decelerationFormControl.setValue(json.deceleration);
      }
      if ((typeof json.period !== 'undefined')) {
        this.periodFormControl.setValue(json.period);
      }
      if ((typeof json.pule_widths_max !== 'undefined')) {
        this.pulseMaxRange.setValue(json.pule_widths_max);
      }
      if ((typeof json.pule_widths_min !== 'undefined')) {
        this.pulseMinRange.setValue(json.pule_widths_min);
      }
      if ((typeof json.rotation_range_max !== 'undefined')) {
        this.degreeMax.setValue(json.rotation_range_max);
      }
      if ((typeof json.rotation_range_min !== 'undefined')) {
        this.degreeMin.setValue(json.rotation_range_min);
      }
      if ((typeof json.velocity !== 'undefined')) {
        this.velocityFormControl.setValue(json.velocity);
      }
    });

    this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
      if (isInitialized) {
        console.log('register ' + this.motorName);
        this.rosService.registerMotor(this.motorName, this.messageReceiver$);
      }
    })
  }

  sendMessage() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      let motorNames: string[] = []

      if (this.isCombinedSlider) {
        motorNames = this.motorService.getMotorHandNames(this.groupSide);

        motorNames.forEach(mn => {
          const message: Message = {
            motor: mn,
            value: this.sliderFormControl.value,
          }
          this.rosService.sendMessage(message);
        });
      } else {
        const message: Message = {
          motor: this.motorName,
          value: this.sliderFormControl.value,
        }
        this.rosService.sendMessage(message);
      }
    }, 500);
  }

  checkValidity(): boolean {
    return this.velocityFormControl.valid && this.accelerationFormControl.valid
      && this.decelerationFormControl.valid && this.periodFormControl.valid
      && this.pulseMaxRange.valid && this.pulseMinRange.valid && this.degreeMax.valid
      && this.degreeMin.valid
  }

  sendSettingMessage() {
    clearTimeout(this.timer); // clear the previous timer
    this.timer = setTimeout(() => {
      if (this.checkValidity()) {
        let motorNames: string[] = []
        if (this.isCombinedSlider) {
          motorNames = this.motorService.getMotorHandNames(this.groupSide);
          motorNames.forEach(mn => {
            const message: Message = {
              motor: mn,
              pule_widths_min: this.pulseMinRange.value,
              pule_widths_max: this.pulseMaxRange.value,
              rotation_range_min: this.degreeMin.value,
              rotation_range_max: this.degreeMax.value,
              velocity: this.velocityFormControl.value,
              acceleration: this.accelerationFormControl.value,
              deceleration: this.decelerationFormControl.value,
              period: this.periodFormControl.value
            }
            this.rosService.sendMessage(message);
          });
        } else {
          const message: Message = {
            motor: this.motorName,
            pule_widths_min: this.pulseMinRange.value,
            pule_widths_max: this.pulseMaxRange.value,
            rotation_range_min: this.degreeMin.value,
            rotation_range_max: this.degreeMax.value,
            velocity: this.velocityFormControl.value,
            acceleration: this.accelerationFormControl.value,
            deceleration: this.decelerationFormControl.value,
            period: this.periodFormControl.value
          }
          this.rosService.sendMessage(message);
        }
      }
    }, 500);
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
    let motorNames: string[] = []
    if (this.isCombinedSlider) {
      motorNames = this.motorService.getMotorHandNames(this.groupSide);

      motorNames.forEach(mn => {
        const message: Message = {
          motor: mn,
          turnedOn: this.motorFormControl.value
        }
        this.rosService.sendMessage(message);
      });
    } else {
      const message: Message = {
        motor: this.motorName,
        turnedOn: this.motorFormControl.value
      }
      this.rosService.sendMessage(message);
    }
  }

  openPopup(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'xl' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      console.log(this.closeResult);
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  sendAllMessagesCombined() {
    let motorNames: string[] = []
    if (this.checkValidity()) {
      if (this.isCombinedSlider) {
        motorNames = this.motorService.getMotorHandNames(this.groupSide);
        motorNames.forEach(mn => {
          const message: Message = {
            motor: mn,
            value: this.sliderFormControl.value,
            turnedOn: this.motorFormControl.value,
            pule_widths_min: this.pulseMinRange.value,
            pule_widths_max: this.pulseMaxRange.value,
            rotation_range_min: this.degreeMin.value,
            rotation_range_max: this.degreeMax.value,
            velocity: this.velocityFormControl.value,
            acceleration: this.accelerationFormControl.value,
            deceleration: this.decelerationFormControl.value,
            period: this.periodFormControl.value
          }
          this.rosService.sendMessage(message);
        });
      } else {
        const message: Message = {
          motor: this.motorName,
          value: this.sliderFormControl.value,
          turnedOn: this.motorFormControl.value,
          pule_widths_min: this.pulseMinRange.value,
          pule_widths_max: this.pulseMaxRange.value,
          rotation_range_min: this.degreeMin.value,
          rotation_range_max: this.degreeMax.value,
          velocity: this.velocityFormControl.value,
          acceleration: this.accelerationFormControl.value,
          deceleration: this.decelerationFormControl.value,
          period: this.periodFormControl.value
        }
        this.rosService.sendMessage(message);
      }
    } else {
      if (this.isCombinedSlider) {
        motorNames = this.motorService.getMotorHandNames(this.groupSide);
        motorNames.forEach(mn => {
          const message: Message = {
            motor: mn,
            value: this.sliderFormControl.value,
            turnedOn: this.motorFormControl.value,
          }
          this.rosService.sendMessage(message);
        });
      } else {
        const message: Message = {
          motor: this.motorName,
          value: this.sliderFormControl.value,
          turnedOn: this.motorFormControl.value,
        }
        this.rosService.sendMessage(message);
      }

    }
  }



}