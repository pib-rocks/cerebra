import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { RosService } from '../shared/ros.service';
import { MotorCurrentMessage } from '../shared/currentMessage';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'app-head',
  templateUrl: './head.component.html',
  styleUrls: ['./head.component.css']
})
export class HeadComponent implements OnInit {

  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  constructor(private rosService: RosService){}

  ngOnInit(): void {
    this.rosService.currentReceiver$.subscribe(message => {
      for (let i = 0; i < this.currentConsumptionOfMotors.length; i++) {
        if (message['motor'] === this.currentConsumptionOfMotors[i]['motor']) {
          console.log('current value' + message['currentValue']);
          this.currentConsumptionOfMotors[i]['value'] = message['currentValue'];
        }
      }
    })
  }
  
  sliders = [{ name: "tilt_forward_motor", label: "Tilt Forward" },
  { name: "tilt_sideways_motor", label: "Tilt Sideways" },
  { name: "turn_head_motor", label: "Head Rotation" }
]
  tiltForwardMotor =  { name: "tilt_forward_motor", label: "Tilt Forward" }

  tiltSideWaysMotor =  { name: "tilt_sideways_motor", label: "Tilt Sideways" }

  turnHeadMotor =  { name: "turn_head_motor", label: "Head Rotation" }

  currentConsumptionOfMotors = [
    { motor: 'currentConsumption', value: 1230 },
    { motor: 'secondCurrentCnsumption', value: 60 }
  ]

  sendDummyMessage() {
      for (let i = 0; i < this.currentConsumptionOfMotors.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentConsumptionOfMotors[i]['motor'],
          currentValue: Math.floor(Math.random() * 2000)
        }
        this.rosService.sendMessage(message);
      }
    }

    reset() {
      this.childComponents.forEach(child => {
        if (child.sliderFormControl.value != 0) {
          child.sliderFormControl.setValue("0");
          child.sendMessage();
        }
      })
    }
}
