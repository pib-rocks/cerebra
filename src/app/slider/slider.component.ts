import { Component, Input, OnInit, TemplateRef } from '@angular/core';
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


  maxRange: FormControl = new FormControl(1000);
  minRange: FormControl = new FormControl(-1000);
  degreeMax: FormControl = new FormControl(0);
  degreeMin: FormControl = new FormControl(0);

  @Input() motorName = '';
  @Input() labelName = '';
  @Input() groupSide = 'left';
  @Input() isGroup = false;
  @Input() sliderTrigger$ = new Subject<string>();

  closeResult!: string;

  isCombinedSlider = false;
  messageReceiver$ = new Subject<Message>();

  motorFormControl: FormControl = new FormControl(true);
  sliderFormControl: FormControl = new FormControl(0);
  velocityFormControl: FormControl = new FormControl(0);
  accelerationFormControl: FormControl = new FormControl(0);
  decelerationFormControl: FormControl = new FormControl(0);
  periodFormControl: FormControl = new FormControl(0);


  constructor(private rosService: RosService, private motorService: MotorService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.isCombinedSlider = this.isGroup && this.labelName === "Open/Close all fingers";

    this.messageReceiver$.subscribe(json => {
      const value = json.value;
      console.log('set value for ' + json['motor']);
      this.sliderFormControl.setValue(this.getValueWithinRange(Number(value)));
    });

    this.rosService.isInitialized$.subscribe((isInitialized: boolean) => {
      if (isInitialized) {
        console.log('register ' + this.motorName);
        this.rosService.registerMotor(this.motorName, this.messageReceiver$);
      }
    })
  }

  sendMessage() {
    if (this.isCombinedSlider) {
      const motorNames = this.motorService.getMotorNames(this.groupSide);

      motorNames.forEach(mn => {
        const message: Message = {
          motor: mn,
          value: this.sliderFormControl.value,
          pule_widths_min: "",
          pule_widths_max: "",
          rotation_range_min: "",
          rotation_range_max: "",
          velocity: "",
          acceleration: "",
          deceleration: "",
          period: ""
        }
        this.rosService.sendMessage(message);
      });
    } else {
      const message: Message = {
        motor: this.motorName,
        value: this.sliderFormControl.value,
        pule_widths_min: "",
        pule_widths_max: "",
        rotation_range_min: "",
        rotation_range_max: "",
        velocity: "",
        acceleration: "",
        deceleration: "",
        period: ""
      }
      this.rosService.sendMessage(message);
    }
  }

  getValueWithinRange(value: number) {
    let validVal;
    if (value > this.maxRange.value) {
      validVal = this.maxRange.value;
    } else if (value < this.minRange.value) {
      validVal = this.minRange.value;
    } else {
      validVal = value;
    }
    return validVal;
  }

  turnTheMotorOnAndOff(event: Event) {
    const isChecked = (<HTMLInputElement>event.target).checked;
    if (isChecked) {
      console.log('the motor is turned on');
    } else {
      console.log('the motor is turned off');
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
}
