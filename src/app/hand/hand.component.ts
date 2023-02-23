import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css']
})
export class HandComponent implements OnInit {

  @Input() side = "Left";

  constructor(private route: ActivatedRoute) {}

  leftFingers = [
    {topic: "thumb_left_stretch", label:"Thumb"},
    {topic: "thumb_left_opposition", label:"Thumb opposition"},
    {topic: "index_left_stretch", label:"Index finger"},
    {topic: "middle_left_stretch", label:"Middle finger"},
    {topic: "ring_left_stretch", label:"Ring finger"},
    {topic: "pinky_left_stretch", label:"Pinky finger"}
  ]

  rightFingers = [
    {topic: "thumb_right_stretch", label:"Thumb"},
    {topic: "thumb_right_opposition", label:"Thumb opposition"},
    {topic: "index_right_stretch", label:"Index finger"},
    {topic: "middle_right_stretch", label:"Middle finger"},
    {topic: "ring_right_stretch", label:"Ring finger"},
    {topic: "pinky_right_stretch", label:"Pinky finger"}
  ]

    ngOnInit(): void {
      this.route.params.subscribe((params: Params) => {
        this.side = params['side'];
      })
    }

    reset() {
      console.log("reset");
    }
}
