import {Component, Input, OnInit, QueryList, ViewChildren} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MotorControlComponent} from "../motor-control/motor-control.component";
import {MotorCurrentMessage} from "../shared/currentMessage";
import {RosService} from "../shared/ros.service";

@Component({
    selector: "app-right-arm",
    templateUrl: "./arm.component.html",
    styleUrls: ["./arm.component.css"],
})
export class ArmComponent implements OnInit {
    @Input() side = "Left";
    @ViewChildren(MotorControlComponent)
    childSilderComponents!: QueryList<MotorControlComponent>;

    constructor(
        private rosService: RosService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    ngOnInit(): void {
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

    leftArm = [
        {topic: "/upper_arm_left_rotation", label: "Upper arm rotation"},
        {topic: "/elbow_left", label: "Elbow Position"},
        {topic: "/lower_arm_left_rotation", label: "Lower arm rotation"},
        {topic: "/wrist_left", label: "Wrist Position"},
        {topic: "/shoulder_vertical_left", label: "Shoulder Vertical"},
        {topic: "/shoulder_horizontal_left", label: "Shoulder Horizontal"},
    ];

    rightArm = [
        {topic: "/upper_arm_right_rotation", label: "Upper arm rotation"},
        {topic: "/elbow_right", label: "Elbow Position"},
        {topic: "/lower_arm_right_rotation", label: "Lower arm rotation"},
        {topic: "/wrist_right", label: "Wrist Position"},
        {topic: "/shoulder_vertical_right", label: "Shoulder Vertical"},
        {topic: "/shoulder_horizontal_right", label: "Shoulder Horizontal"},
    ];

    currentLeft = [
        {motor: "shoulder_vertical_left", value: 3000},
        {motor: "shoulder_horizontal_left", value: 2000},
        {motor: "upper_arm_left_rotation", value: 1000},
        {motor: "elbow_left", value: 2000},
        {motor: "lower_arm_left_rotation", value: 2500},
        {motor: "wrist_left", value: 3500},
    ];

    currentRight = [
        {motor: "shoulder_vertical_right", value: 3000},
        {motor: "shoulder_horizontal_right", value: 2000},
        {motor: "upper_arm_right_rotation", value: 1000},
        {motor: "elbow_right", value: 100},
        {motor: "lower_arm_right_rotation", value: 1000},
        {motor: "wrist_right", value: 2000},
    ];

    reset() {
        this.childSilderComponents.forEach((child) => {
            if (child.sliderFormControl.value != 0) {
                child.setSliderValue(0);
                child.sendMessage();
            }
        });
    }
    sendDummyMessage() {
        if (this.side === "left") {
            for (const cl of this.currentLeft) {
                const message: MotorCurrentMessage = {
                    motor: cl["motor"],
                    currentValue: Math.floor(Math.random() * 4000),
                };
                this.rosService.sendSliderMessage(message);
            }
        }

        if (this.side === "right") {
            for (const cr of this.currentRight) {
                const message: MotorCurrentMessage = {
                    motor: cr["motor"],
                    currentValue: Math.floor(Math.random() * 4000),
                };
                this.rosService.sendSliderMessage(message);
            }
        }
    }
}
