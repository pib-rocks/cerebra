import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { Message } from '../shared/message';
import { MotorService } from '../shared/motor.service';
import { RosService } from '../shared/ros.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  maxSliderValue = 9000;
  minSliderValue = -9000;


  @Input() motorName = '';
  @Input() labelName = '';
  @Input() groupSide = 'left';
  @Input() isGroup = false;
  @Input() sliderTrigger$ = new Subject<string>();
  eventSubject$ = new Subject<Event>();

  closeResult!: string;

  isCombinedSlider = false;
  messageReceiver$ = new Subject<Message>();

  motorFormControl: FormControl = new FormControl(true);
  sliderFormControl: FormControl = new FormControl(0);
  velocityFormControl: FormControl = new FormControl(0);
  accelerationFormControl: FormControl = new FormControl(0);
  decelerationFormControl: FormControl = new FormControl(0);
  periodFormControl: FormControl = new FormControl(0);
  plureMaxRange: FormControl = new FormControl(65535);
  plureMinRange: FormControl = new FormControl(1);
  degreeMax: FormControl = new FormControl(0);
  degreeMin: FormControl = new FormControl(0);


  constructor(private rosService: RosService, private motorService: MotorService, private modalService: NgbModal) { }

  ngOnInit(): void {
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
        this.plureMaxRange.setValue(json.pule_widths_max);
      }
      if ((typeof json.pule_widths_min !== 'undefined')) {
        this.plureMinRange.setValue(json.pule_widths_min);
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
  }

  sendSettingMessage() {
    let motorNames: string[] = []
    if (this.isCombinedSlider) {
      motorNames = this.motorService.getMotorHandNames(this.groupSide);
      motorNames.forEach(mn => {
        const message: Message = {
          motor: mn,
          pule_widths_min: this.plureMinRange.value,
          pule_widths_max: this.plureMaxRange.value,
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
          pule_widths_min: this.plureMinRange.value,
          pule_widths_max: this.plureMaxRange.value,
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
    if (this.isCombinedSlider) {
      motorNames = this.motorService.getMotorHandNames(this.groupSide);
      motorNames.forEach(mn => {
        const message: Message = {
          motor: mn,
          value: this.sliderFormControl.value,
          turnedOn: this.motorFormControl.value,
          pule_widths_min: this.plureMinRange.value,
          pule_widths_max: this.plureMaxRange.value,
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
          pule_widths_min: this.plureMinRange.value,
          pule_widths_max: this.plureMaxRange.value,
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
}
