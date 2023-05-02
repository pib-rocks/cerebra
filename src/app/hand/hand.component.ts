import { Component, Input, OnInit, QueryList, ViewChild, ViewChildren , isDevMode} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { SliderComponent } from '../slider/slider.component';
import { RosService } from '../shared/ros.service';
import { MotorCurrentMessage } from '../shared/currentMessage';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: "app-hand",
  templateUrl: "./hand.component.html",
  styleUrls: ["./hand.component.css"],
})
export class HandComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  @Input() side = "left";
  messageReceiver$: Subject<MotorCurrentMessage> =
    new Subject<MotorCurrentMessage>();

  constructor(private route: ActivatedRoute, private rosService: RosService, private router: Router) { }

  leftSwitchControl = new FormControl(false);
  rightSwitchControl = new FormControl(false);

  leftHand = [
    { motor: "index_left_stretch", label: "Open/Close all fingers" },
    { motor: "thumb_left_opposition", label: "Thumb opposition" },
  ];

  leftFingers = [
    { motor: "thumb_left_stretch", label: "Thumb" },
    { motor: "thumb_left_opposition", label: "Thumb opposition" },
    { motor: "index_left_stretch", label: "Index finger" },
    { motor: "middle_left_stretch", label: "Middle finger" },
    { motor: "ring_left_stretch", label: "Ring finger" },
    { motor: "pinky_left_stretch", label: "Pinky finger" },
  ];

  rightHand = [
    { motor: "index_right_stretch", label: "Open/Close all fingers" },
    { motor: "thumb_right_opposition", label: "Thumb opposition" },
  ];

  rightFingers = [
    { motor: "thumb_right_stretch", label: "Thumb" },
    { motor: "thumb_right_opposition", label: "Thumb opposition" },
    { motor: "index_right_stretch", label: "Index finger" },
    { motor: "middle_right_stretch", label: "Middle finger" },
    { motor: "ring_right_stretch", label: "Ring finger" },
    { motor: "pinky_right_stretch", label: "Pinky finger" },
  ];

  currentRight = [
    { motor: "pinky-right", value: 500 },
    { motor: "ring-right", value: 100 },
    { motor: "middle-right", value: 1000 },
    { motor: "index-right", value: 2000 },
    { motor: "thumb-right", value: 1500 },
  ];

  currentLeft = [
    { motor: "pinky-left", value: 1600 },
    { motor: "ring-left", value: 1000 },
    { motor: "middle-left", value: 1700 },
    { motor: "index-left", value: 500 },
    { motor: "thumb-left", value: 300 },
  ];

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.side = params["side"];
    });
    if (!(this.side === 'right' || this.side ==='left')){
      this.router.navigate(['/head']);
    }
    this.rosService.currentReceiver$.subscribe(message => {
      for (let i = 0; i < this.currentLeft.length; i++) {
        if (message["motor"] === this.currentLeft[i]["motor"]) {
          console.log("current value" + message["currentValue"]);
          this.currentLeft[i]["value"] = message["currentValue"];
        }
      }
      for (let i = 0; i < this.currentRight.length; i++) {
        if (message["motor"] === this.currentRight[i]["motor"]) {
          console.log("current value" + message["currentValue"]);
          this.currentRight[i]["value"] = message["currentValue"];
        }
      }
    });
  }

  reset() {
    this.childComponents.forEach((child) => {
      if (child.sliderFormControl.value != 0) {
        child.sliderFormControl.setValue("0");
        child.sendMessage();
      }
    });
  }

  sendDummyMessage() {
    if (this.side === "left") {
      for (let i = 0; i < this.currentLeft.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentLeft[i]["motor"],
          currentValue: Math.floor(Math.random() * 2000),
        };
        this.rosService.sendMessage(message);
      }
    }

    if (this.side === "right") {
      for (let i = 0; i < this.currentRight.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentRight[i]["motor"],
          currentValue: Math.floor(Math.random() * 2000),
        };
        this.rosService.sendMessage(message);
      }
    }
  }

  switchView(side: string) {
    const switchControl =
      side === "left" ? this.leftSwitchControl : this.rightSwitchControl;
    if (switchControl.value === true) {
      const indexFinger = this.childComponents.filter(
        (child) => child.labelName === "Index finger"
      )[0];
      const thumbOppo = this.childComponents.filter(
        (child) => child.labelName === "Thumb opposition"
      )[0];
      console.log("switchView childComponents length");
      console.log(this.childComponents.length);
      this.childComponents.forEach((child) => {
        if (child.labelName != "Thumb opposition") {
          child.sliderFormControl.setValue(indexFinger.sliderFormControl.value);
          child.motorFormControl.setValue(indexFinger.motorFormControl.value);
          child.velocityFormControl.setValue(
            indexFinger.velocityFormControl.value
          );
          child.accelerationFormControl.setValue(
            indexFinger.accelerationFormControl.value
          );
          child.decelerationFormControl.setValue(
            indexFinger.decelerationFormControl.value
          );
          child.periodFormControl.setValue(indexFinger.periodFormControl.value);
          child.pulseMaxRange.setValue(indexFinger.pulseMaxRange.value);
          child.pulseMinRange.setValue(indexFinger.pulseMinRange.value);
          child.degreeMax.setValue(indexFinger.degreeMax.value);
          child.degreeMin.setValue(indexFinger.degreeMin.value);
        } else {
          child.sliderFormControl.setValue(thumbOppo.sliderFormControl.value);
          child.motorFormControl.setValue(thumbOppo.motorFormControl.value);
          child.velocityFormControl.setValue(
            thumbOppo.velocityFormControl.value
          );
          child.accelerationFormControl.setValue(
            thumbOppo.accelerationFormControl.value
          );
          child.decelerationFormControl.setValue(
            thumbOppo.decelerationFormControl.value
          );
          child.periodFormControl.setValue(thumbOppo.periodFormControl.value);
          child.pulseMaxRange.setValue(thumbOppo.pulseMaxRange.value);
          child.pulseMinRange.setValue(thumbOppo.pulseMinRange.value);
          child.degreeMax.setValue(thumbOppo.degreeMax.value);
          child.degreeMin.setValue(thumbOppo.degreeMin.value);
        }
        child.sendAllMessagesCombined();
      });
    } else {
      this.childComponents.forEach((child) => {
        child.sendAllMessagesCombined();
      });
    }
  }
}
