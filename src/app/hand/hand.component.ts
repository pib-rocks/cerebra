import { ChangeDetectorRef, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
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

  constructor(private route: ActivatedRoute, private cdRef: ChangeDetectorRef) { }

  switchControl = new FormControl(false);

  leftHand = [
    { topic: "/index_left_stretch", label: "Open/Close all fingers" },
    { topic: "/thumb_left_opposition", label: "Thumb opposition" }
  ]

  leftFingers = [
    { topic: "/thumb_left_stretch", label: "Thumb" },
    { topic: "/thumb_left_opposition", label: "Thumb opposition" },
    { topic: "/index_left_stretch", label: "Index finger" },
    { topic: "/middle_left_stretch", label: "Middle finger" },
    { topic: "/ring_left_stretch", label: "Ring finger" },
    { topic: "/pinky_left_stretch", label: "Pinky finger" }
  ]

  rightHand = [
    { topic: "/index_right_stretch", label: "Open/Close all fingers" },
    { topic: "/thumb_right_opposition", label: "Thumb opposition" }
  ]

  rightFingers = [
    { topic: "/thumb_right_stretch", label: "Thumb" },
    { topic: "/thumb_right_opposition", label: "Thumb opposition" },
    { topic: "/index_right_stretch", label: "Index finger" },
    { topic: "/middle_right_stretch", label: "Middle finger" },
    { topic: "/ring_right_stretch", label: "Ring finger" },
    { topic: "/pinky_right_stretch", label: "Pinky finger" }
  ]

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.side = params['side'];
    })
  }

  reset() {
    this.childComponents.forEach(child => {
      child.formControl.setValue("0");
      child.sendMessage();
    })
  }

  switchView() {
    if (this.switchControl.value === true) {
      const indexFinger = this.childComponents.filter(child => child.labelName === "Index finger")[0];
      this.childComponents.forEach(child => {
        child.formControl.setValue(indexFinger.formControl.value);
        child.sendMessage();
      })
    }
  }
}
