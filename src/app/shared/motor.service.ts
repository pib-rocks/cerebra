import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MotorService {

  leftFingers = [
    "thumb_left_stretch",
    "index_left_stretch",
    "middle_left_stretch",
    "ring_left_stretch",
    "pinky_left_stretch"
  ];

  rightFingers = [
    "thumb_right_stretch",
    "index_right_stretch",
    "middle_right_stretch",
    "ring_right_stretch",
    "pinky_right_stretch"
  ];

  leftArm = [
    "upper_arm_left_rotation",
    "ellbow_left",
    "lower_arm_left_rotation",
    "wrist_left"
  ];

  rightArm = [
    "upper_arm_right_rotation",
    "ellbow_right",
    "lower_arm_right_rotation",
    "wrist_right",
  ];



  getMotorHandNames(side: string) {
    return side === 'left' ? this.leftFingers : this.rightFingers;
  }


  getMotorArmNames(side: string) {
    return side === 'left' ? this.leftArm : this.rightArm;
  }

}