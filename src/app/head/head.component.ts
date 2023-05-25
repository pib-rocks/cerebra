import { Component, OnInit, QueryList, ViewChildren } from "@angular/core";
import { RosService } from "../shared/ros.service";
import { MotorCurrentMessage } from "../shared/currentMessage";
import { SliderComponent } from "../slider/slider.component";

@Component({
  selector: "app-head",
  templateUrl: "./head.component.html",
  styleUrls: ["./head.component.css"],
})
export class HeadComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  constructor(private rosService: RosService) {}

  ngOnInit(): void {
    this.rosService.currentReceiver$.subscribe((message) => {
      for (const cc of this.currentConsumptionOfMotors) {
        if (message["motor"] === cc["motor"]) {
          console.log("current value" + message["currentValue"]);
          cc["value"] = message["currentValue"];
        }
      }
    });
  }

  sliders = [
    { name: "tilt_forward_motor", label: "Tilt Forward" },
    { name: "tilt_sideways_motor", label: "Tilt Sideways" },
    { name: "turn_head_motor", label: "Head Rotation" },
  ];
  tiltForwardMotor = { name: "tilt_forward_motor", label: "Tilt Forward" };

  tiltSideWaysMotor = { name: "tilt_sideways_motor", label: "Tilt Sideways" };

  turnHeadMotor = { name: "turn_head_motor", label: "Head Rotation" };

  currentConsumptionOfMotors = [
    { motor: "currentConsumption", value: 1230 },
    { motor: "secondCurrentCnsumption", value: 60 },
  ];

  sendDummyMessage() {
    for (const cc of this.currentConsumptionOfMotors) {
      const message: MotorCurrentMessage = {
        motor: cc["motor"],
        currentValue: Math.floor(Math.random() * 2000),
      };
      this.rosService.sendSliderMessage(message);
    }
  }

  reset() {
    this.childComponents.forEach((child) => {
      if (child.sliderFormControl.value != 0) {
        child.sliderFormControl.setValue("0");
        child.sendMessage();
      }
    });
  }
}
