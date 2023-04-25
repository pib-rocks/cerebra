import { Component } from '@angular/core';
import { RosService } from '../shared/ros.service';
import { MotorCurrentMessage } from '../shared/currentMessage';

@Component({
  selector: 'app-head',
  templateUrl: './head.component.html',
  styleUrls: ['./head.component.css']
})
export class HeadComponent {


  constructor(private rosService: RosService){}
  
  tiltForwardMotor =  { name: "index_right_stretch", label: "Setting the position of the Motor" }

  tiltSideWaysMotor =  { name: "index_right_stretch", label: "Setting the position of the Motor" }

  turnTheHeadMotor =  { name: "index_right_stretch", label: "Setting the position of the Motor" }

  currentConsumptionOfMotors = [
    { motor: 'currentConsumption', value: 1230 },
    { motor: 'secondCurrentCnsumption', value: 60 }
  ]


   sendMotorSettingToRos(){



      for (let i = 0; i < this.currentConsumptionOfMotors.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentConsumptionOfMotors[i]['motor'],
          currentValue: Math.floor(Math.random() * 2000)
        }

        this.rosService.sendMessage(message);
      }
    }





}
