import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-right-arm',
  templateUrl: './arm.component.html',
  styleUrls: ['./arm.component.css']
})
export class ArmComponent {
  @Input() side = "Left";

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
}
