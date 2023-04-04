import { Component, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { SliderComponent } from '../slider/slider.component';
import { RosService } from '../shared/ros.service';
import { MotorCurrentMessage } from '../shared/currentMessage';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css']
})
export class HandComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  @Input() side = "left";
  heightN: number = 100;
  height: string = this.heightN / 2.3 + 'px';
  messageReceiver$: Subject<MotorCurrentMessage> = new Subject<MotorCurrentMessage>;

  constructor(private route: ActivatedRoute, private rosService: RosService) { }

  leftSwitchControl = new FormControl(false);
  rightSwitchControl = new FormControl(false);

  leftHand = [
    { motor: "index_left_stretch", label: "Open/Close all fingers" },
    { motor: "thumb_left_opposition", label: "Thumb opposition" }
  ]

  leftFingers = [
    { motor: "thumb_left_stretch", label: "Thumb" },
    { motor: "thumb_left_opposition", label: "Thumb opposition" },
    { motor: "index_left_stretch", label: "Index finger" },
    { motor: "middle_left_stretch", label: "Middle finger" },
    { motor: "ring_left_stretch", label: "Ring finger" },
    { motor: "pinky_left_stretch", label: "Pinky finger" }
  ]

  rightHand = [
    { motor: "index_right_stretch", label: "Open/Close all fingers" },
    { motor: "thumb_right_opposition", label: "Thumb opposition" }
  ]

  rightFingers = [
    { motor: "thumb_right_stretch", label: "Thumb" },
    { motor: "thumb_right_opposition", label: "Thumb opposition" },
    { motor: "index_right_stretch", label: "Index finger" },
    { motor: "middle_right_stretch", label: "Middle finger" },
    { motor: "ring_right_stretch", label: "Ring finger" },
    { motor: "pinky_right_stretch", label: "Pinky finger" }
  ]

  currentRight = [
    { motor: 'pinky-right', value: 30 },
    { motor: 'ring-right', value: 30 },
    { motor: 'middle-right', value: 30 },
    { motor: 'index-right', value: 30 },
    { motor: 'thumb-right', value: 30 }
  ]

  currentLeft = [
    { motor: 'pinky-left', value: 30 },
    { motor: 'ring-left', value: 30 },
    { motor: 'middle-left', value: 30 },
    { motor: 'index-left', value: 30 },
    { motor: 'thumb-left', value: 30 }
  ]

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.side = params['side'];
    });
    this.rosService.currentReceiver$.subscribe(message => {
      for (let i = 0; i < this.currentLeft.length; i++) {
        if (message['motor'] === this.currentLeft[i]['motor']) {
          console.log('current value' + message['currentValue']);
          this.currentLeft[i]['value'] = message['currentValue'];
        }
      }
      for (let i = 0; i < this.currentRight.length; i++) {
        if (message['motor'] === this.currentRight[i]['motor']) {
          console.log('current value' + message['currentValue']);
          this.currentRight[i]['value'] = message['currentValue'];
        }
      }
    })
  }

  reset() {
    this.childComponents.forEach(child => {
      if (child.sliderFormControl.value != 0) {
        child.sliderFormControl.setValue("0");
        child.sendMessage();
      }
    })
  }

  sendDummyMessage() {
    if (this.side === 'left') {
      for (let i = 0; i < this.currentLeft.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentLeft[i]['motor'],
          currentValue: Math.floor(Math.random() * 2000)
        }

        this.rosService.sendMessage(message);
      }
    }

    if (this.side === 'right') {
      for (let i = 0; i < this.currentRight.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentRight[i]['motor'],
          currentValue: Math.floor(Math.random() * 2000)
        }
        this.rosService.sendMessage(message);
      }
    }
  }

  switchView(side: string) {
    const switchControl = side === 'left' ? this.leftSwitchControl : this.rightSwitchControl;
    if (switchControl.value === true) {
      const indexFinger = this.childComponents.filter(child => child.labelName === "Index finger")[0];
      const thumbOppo = this.childComponents.filter(child => child.labelName === "Thumb opposition")[0];
      console.log('switchView childComponents length')
      console.log(this.childComponents.length);
      this.childComponents.forEach(child => {
        child.sliderFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.sliderFormControl.value
          : indexFinger.sliderFormControl.value);
        child.motorFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.motorFormControl.value
          : indexFinger.motorFormControl.value);
        child.velocityFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.velocityFormControl.value
          : indexFinger.velocityFormControl.value);
        child.accelerationFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.accelerationFormControl.value
          : indexFinger.accelerationFormControl.value);
        child.decelerationFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.decelerationFormControl.value
          : indexFinger.decelerationFormControl.value);
        child.periodFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.periodFormControl.value
          : indexFinger.periodFormControl.value);
        child.pulseMaxRange.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.pulseMaxRange.value
          : indexFinger.pulseMaxRange.value);
        child.pulseMinRange.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.pulseMinRange.value
          : indexFinger.pulseMinRange.value);
        child.degreeMax.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.degreeMax.value
          : indexFinger.degreeMax.value);
        child.degreeMin.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.degreeMin.value
          : indexFinger.degreeMin.value);
        child.sendAllMessagesCombined();
      });
    } else {
      this.childComponents.forEach(child => {
        child.sendAllMessagesCombined();
      });
    }
  }


}
