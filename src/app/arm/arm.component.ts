import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Params,Router } from '@angular/router';
import { SliderComponent } from '../slider/slider.component';
import { MotorCurrentMessage } from '../shared/currentMessage';
import { RosService } from '../shared/ros.service';

@Component({
  selector: "app-right-arm",
  templateUrl: "./arm.component.html",
  styleUrls: ["./arm.component.css"],
})
export class ArmComponent implements OnInit {
  @Input() side = "Left";
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  constructor(private rosService: RosService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.side = params['side'];
    })
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

  leftArm = [
    { topic: "/upper_arm_left_rotation", label: "Upper arm rotation" },
    { topic: "/ellbow_left", label: "Ellbow Position" },
    { topic: "/lower_arm_left_rotation", label: "Lower arm rotation" },
    { topic: "/wrist_left", label: "Wrist Position" },
    { topic: "/shoulder_vertical_left", label: "Shoulder Vertical" },
    { topic: "/shoulder_horizontal_left", label: "Shoulder Horizontal" },
  ];

  rightArm = [
    { topic: "/upper_arm_right_rotation", label: "Upper arm rotation" },
    { topic: "/ellbow_right", label: "Ellbow Position" },
    { topic: "/lower_arm_right_rotation", label: "Lower arm rotation" },
    { topic: "/wrist_right", label: "Wrist Position" },
    { topic: "/shoulder_vertical_right", label: "Shoulder Vertical" },
    { topic: "/shoulder_horizontal_right", label: "Shoulder Horizontal" },
  ];

  currentLeft = [
    { motor: "shoulder_vertical_left", value: 3000 },
    { motor: "shoulder_horizontal_left", value: 2000 },
    { motor: "upper_arm_left_rotation", value: 1000 },
    { motor: "ellbow_left", value: 2000 },
    { motor: "lower_arm_left_rotation", value: 2500 },
    { motor: "wrist_left", value: 3500 },
  ];

  currentRight = [
    { motor: "shoulder_vertical_right", value: 3000 },
    { motor: "shoulder_horizontal_right", value: 2000 },
    { motor: "upper_arm_right_rotation", value: 1000 },
    { motor: "ellbow_right", value: 100 },
    { motor: "lower_arm_right_rotation", value: 1000 },
    { motor: "wrist_right", value: 2000 },
  ];

  reset() {
    this.childComponents.forEach((child) => {
      if (child.sliderFormControl.value != 0) {
        child.sliderFormControl.setValue(0);
        child.sendMessage();
      }
    });
  }
  sendDummyMessage() {
    if (this.side === "left") {
      for (let i = 0; i < this.currentLeft.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentLeft[i]["motor"],
          currentValue: Math.floor(Math.random() * 4000),
        };
        this.rosService.sendSliderMessage(message);
      }
    }

    if (this.side === "right") {
      for (let i = 0; i < this.currentRight.length; i++) {
        const message: MotorCurrentMessage = {
          motor: this.currentRight[i]["motor"],
          currentValue: Math.floor(Math.random() * 4000),
        };
        this.rosService.sendSliderMessage(message);
      }
    }
  }
}
