import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'app-right-arm',
  templateUrl: './arm.component.html',
  styleUrls: ['./arm.component.css']
})
export class ArmComponent {
  @Input() side = "Left";
    
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;
  
  constructor(private route: ActivatedRoute) {}

  leftArm = [
    {topic: "/upper_arm_left_rotation", label:"Upper arm rotation"},
    {topic: "/ellbow_left", label:"Ellbow Position"},
    {topic: "/lower_arm_left_rotation", label:"Lower arm rotation"},
    {topic: "/wrist_left", label:"Middle finger"},
  ]

  rightArm = [
    {topic: "/upper_arm_right_rotation", label:"Upper arm rotation"},
    {topic: "/ellbow_right", label:"Ellbow Position"},
    {topic: "/lower_arm_right_rotation", label:"Lower arm rotation"},
    {topic: "/wrist_right", label:"Wrist position"},
  ]

    ngOnInit(): void {
      this.route.params.subscribe((params: Params) => {
        this.side = params['side'];
      })
    }

    reset() {
      this.childComponents.forEach(child => {
        if (child.formControl.value != 0){
          child.formControl.setValue(0);
          child.sendMessage();
        }
      });
    }
}
