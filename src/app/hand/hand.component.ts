import { Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css']
})
export class HandComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;
  @ViewChild('myInput', { static: false }) myInput!: ElementRef<HTMLInputElement>;
  dummySubject$: Subject<string> = new Subject()

  @Input() side = "Left";

  constructor(private route: ActivatedRoute) { }

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

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.side = params['side'];
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
        child.plureMaxRange.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.plureMaxRange.value
          : indexFinger.plureMaxRange.value);
        child.plureMinRange.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.plureMinRange.value
          : indexFinger.plureMinRange.value);
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
