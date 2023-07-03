import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { SliderComponent } from "../slider/slider.component";
import { RosService } from "../shared/ros.service";
import { MotorCurrentMessage } from "../shared/currentMessage";
import { Subject } from "rxjs";

@Component({
  selector: "app-hand",
  templateUrl: "./hand.component.html",
  styleUrls: ["./hand.component.css"],
})
export class HandComponent implements OnInit {
  @ViewChildren(SliderComponent) childComponents!: QueryList<SliderComponent>;

  @Input() side = "left";
  messageReceiver$: Subject<MotorCurrentMessage> =
    new Subject<MotorCurrentMessage>();
  displayAll!: string;
  displayIndividual!: string;


  constructor(
    private route: ActivatedRoute,
    private rosService: RosService,
    private router: Router

  ) { }

  leftSwitchControl = new FormControl(false);
  rightSwitchControl = new FormControl(false);


  leftFingers = [
    { motor: "thumb_left_stretch", label: "Thumb" },
    { motor: "index_left_stretch", label: "Index finger" },
    { motor: "middle_left_stretch", label: "Middle finger" },
    { motor: "ring_left_stretch", label: "Ring finger" },
    { motor: "pinky_left_stretch", label: "Pinky finger" },
  ];

  thumbOppositionLeft = { motor: "thumb_left_opposition", label: "Thumb opposition" };
  allFingersLeft = { motor: "all_left_stretch", label: "Open/Close all fingers" };


  rightFingers = [
    { motor: "thumb_right_stretch", label: "Thumb" },
    { motor: "index_right_stretch", label: "Index finger" },
    { motor: "middle_right_stretch", label: "Middle finger" },
    { motor: "ring_right_stretch", label: "Ring finger" },
    { motor: "pinky_right_stretch", label: "Pinky finger" },
  ];
  thumbOppositionRight = { motor: "thumb_right_opposition", label: "Thumb opposition" };
  allFingersRight = { motor: "all_right_stretch", label: "Open/Close all fingers" };

  currentRight = [
    { motor: "pinky-right", value: 500 },
    { motor: "ring-right", value: 100 },
    { motor: "middle-right", value: 1000 },
    { motor: "index-right", value: 2000 },
    { motor: "thumb-right", value: 1500 },
  ];

  currentLeft = [
    { motor: "pinky-left", value: 1600 },
    { motor: "ring-left", value: 1000 },
    { motor: "middle-left", value: 1700 },
    { motor: "index-left", value: 500 },
    { motor: "thumb-left", value: 300 },
  ];

  ngOnInit(): void {
    this.displayIndividual = 'none'
    this.route.params.subscribe((params: Params) => {
      this.side = params["side"];
    });
    if (!(this.side === "right" || this.side === "left")) {
      this.router.navigate(["/head"]);
    }
    this.rosService.currentReceiver$.subscribe((message) => {
      for (const cl of this.currentLeft) {
        if (message["motor"] === cl["motor"]) {
          console.log("current value" + message["currentValue"]);
          cl["value"] = message["currentValue"];
        }
      }
      for (const cr of this.currentRight) {
        if (message["motor"] === cr["motor"]) {
          console.log("current value" + message["currentValue"]);
          cr["value"] = message["currentValue"];
        }
      }
    });
  }

  reset() {
    if (this.leftSwitchControl.value || this.rightSwitchControl.value) {
      console.log(this.leftSwitchControl.value || this.rightSwitchControl.value)
      this.childComponents.filter(child => !child.motorName.includes('all')).forEach((child) => {
        if (child.sliderFormControl.value != 0) {
          child.setSliderValue(0);
          child.sendAllMessagesCombined();
        }
      });
    } else {
      this.childComponents.filter(child => child.motorName.includes('all') || child.motorName.includes('opposition')).forEach((child) => {
        if (child.sliderFormControl.value != 0) {
          child.setSliderValue(0);
          child.sendAllMessagesCombined();
        }
      });
    }

  }

  sendDummyMessage() {
    if (this.side === "left") {
      for (const cl of this.currentLeft) {
        const message: MotorCurrentMessage = {
          motor: cl["motor"],
          currentValue: Math.floor(Math.random() * 2000),
        };
        this.rosService.sendSliderMessage(message);
      }
    }

    if (this.side === "right") {
      for (const cr of this.currentRight) {
        const message: MotorCurrentMessage = {
          motor: cr["motor"],
          currentValue: Math.floor(Math.random() * 2000),
        };
        this.rosService.sendSliderMessage(message);
      }
    }
  }


  switchView(side: string) {
    let calledOposite = false;
    const switchControl =
      side === "left" ? this.leftSwitchControl : this.rightSwitchControl;
    if (switchControl.value === true) {
      this.displayAll = 'block';
      this.displayIndividual = 'none';
      const indexFinger = this.childComponents.filter(
        (child) => child.labelName === "Index finger"
      )[0];
      this.childComponents.forEach((child) => {
        if (child.labelName != "Thumb opposition") {
          child.sliderFormControl.setValue(indexFinger.sliderFormControl.value);
          child.motorFormControl.setValue(indexFinger.motorFormControl.value);
          child.velocityFormControl.setValue(
            indexFinger.velocityFormControl.value
          );
          child.accelerationFormControl.setValue(
            indexFinger.accelerationFormControl.value
          );
          child.decelerationFormControl.setValue(
            indexFinger.decelerationFormControl.value
          );
          child.periodFormControl.setValue(indexFinger.periodFormControl.value);
          child.pulseMaxRange.setValue(indexFinger.pulseMaxRange.value);
          child.pulseMinRange.setValue(indexFinger.pulseMinRange.value);
          child.degreeMaxFormcontrol.setValue(indexFinger.degreeMaxFormcontrol.value);
          child.degreeMinFormcontrol.setValue(indexFinger.degreeMinFormcontrol.value);
        }
        if (side === 'right') {
          if (child.motorName === 'all_right_stretch') {
            child.sendAllMessagesCombined();
          }
          if (child.motorName.includes('right_opposition') && !calledOposite) {
            calledOposite = true;
            child.sendAllMessagesCombined();
          }
        }
        if (side === 'left') {
          if (child.motorName === 'all_left_stretch') {
            child.sendAllMessagesCombined();
          }
          if (child.motorName.includes('left_opposition') && !calledOposite) {
            calledOposite = true;
            child.sendAllMessagesCombined();
          }
        }
      })
    } else {
      this.displayAll = 'none';
      this.displayIndividual = 'block';
      const sliderAll = this.childComponents.filter(
        (child) => child.labelName === "Open/Close all fingers"
      )[0];
      this.childComponents.forEach((child) => {
        if (child.labelName != "Thumb opposition") {
          child.sliderFormControl.setValue(sliderAll.sliderFormControl.value);
        }
      })
      if (side === 'right') {
        this.childComponents.forEach((child) => {
          if (child.motorName === 'all_right_stretch') {
            child.sendAllMessagesCombined();
          }
          if (child.motorName.includes('right_opposition') && !calledOposite) {
            calledOposite = true;
            child.sendAllMessagesCombined();
          }
        });
      } else {
        this.childComponents.forEach((child) => {
          if (child.motorName === 'all_left_stretch') {
            child.sendAllMessagesCombined();
          }
          if (child.motorName.includes('left_opposition') && !calledOposite) {
            calledOposite = true;
            child.sendAllMessagesCombined();
          }
        });
      }
    }
    this.childComponents.forEach(child => child.setThumbPosition());
  }
}