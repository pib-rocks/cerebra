import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FingerService {

  leftFingers = [
    "/thumb_left_stretch",
    "/index_left_stretch",
    "/middle_left_stretch",
    "/ring_left_stretch",
    "/pinky_left_stretch"
  ];

  rightFingers = [
    "/thumb_right_stretch",
    "/index_right_stretch",
    "/middle_right_stretch",
    "/ring_right_stretch",
    "/pinky_right_stretch"
  ];

  getFingerTopics(side: string) {
    return side === 'left' ? this.leftFingers : this.rightFingers;
  }

}