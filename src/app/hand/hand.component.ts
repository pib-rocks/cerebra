import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css']
})
export class HandComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

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
      if(child.sliderFormControl.value != 0){
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
      this.childComponents.forEach(child => {
        child.sliderFormControl.setValue(child.labelName == "Thumb opposition"
          ? thumbOppo.sliderFormControl.value
          : indexFinger.sliderFormControl.value);
        child.sendMessage();
      });
    } else {
      this.childComponents.forEach(child => {
        child.sendMessage();
      });
    }
  }
}
