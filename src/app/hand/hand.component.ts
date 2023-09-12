import {
    Component,
    ElementRef,
    Input,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MotorControlComponent} from "../motor-control/motor-control.component";
import {RosService} from "../shared/ros.service";
import {MotorCurrentMessage} from "../shared/currentMessage";
import {Subject} from "rxjs";

@Component({
    selector: "app-hand",
    templateUrl: "./hand.component.html",
    styleUrls: ["./hand.component.css"],
})
export class HandComponent implements OnInit {
    @ViewChildren(MotorControlComponent)
    childComponents!: QueryList<MotorControlComponent>;

    @Input() side = "left";
    messageReceiver$: Subject<MotorCurrentMessage> =
        new Subject<MotorCurrentMessage>();
    displayAll!: string;
    displayIndividual!: string;

    leftSwitchControl = new FormControl(false);
    rightSwitchControl = new FormControl(false);

    constructor(
        private route: ActivatedRoute,
        private rosService: RosService,
        private router: Router,
    ) {}

    @ViewChild("leftSwitch") leftHandSwitch?: ElementRef;
    @ViewChild("rightSwitch") rightHandSwitch?: ElementRef;
    firstLoad: boolean = false;

    leftHandSwitchSave: boolean = false;
    rightHandSwitchSave: boolean = false;

    leftFingers = [
        {motor: "thumb_left_stretch", label: "Thumb"},
        {motor: "index_left_stretch", label: "Index finger"},
        {motor: "middle_left_stretch", label: "Middle finger"},
        {motor: "ring_left_stretch", label: "Ring finger"},
        {motor: "pinky_left_stretch", label: "Pinky finger"},
    ];

    thumbOppositionLeft = {
        motor: "thumb_left_opposition",
        label: "Thumb opposition",
    };
    allFingersLeft = {
        motor: "all_left_stretch",
        label: "Open/Close all fingers",
    };

    rightFingers = [
        {motor: "thumb_right_stretch", label: "Thumb"},
        {motor: "index_right_stretch", label: "Index finger"},
        {motor: "middle_right_stretch", label: "Middle finger"},
        {motor: "ring_right_stretch", label: "Ring finger"},
        {motor: "pinky_right_stretch", label: "Pinky finger"},
    ];
    thumbOppositionRight = {
        motor: "thumb_right_opposition",
        label: "Thumb opposition",
    };
    allFingersRight = {
        motor: "all_right_stretch",
        label: "Open/Close all fingers",
    };

    currentRight = [
        {motor: "pinky-right", value: 500},
        {motor: "ring-right", value: 100},
        {motor: "middle-right", value: 1000},
        {motor: "index-right", value: 2000},
        {motor: "thumb-right", value: 1500},
    ];

    currentLeft = [
        {motor: "pinky-left", value: 1600},
        {motor: "ring-left", value: 1000},
        {motor: "middle-left", value: 1700},
        {motor: "index-left", value: 500},
        {motor: "thumb-left", value: 300},
    ];

    ngOnInit(): void {
        this.firstLoad = true;
        this.displayIndividual = "none";
        this.route.params.subscribe((params: Params) => {
            this.side = params["side"];
            if (!this.firstLoad) {
                this.switchView(true);
            }
            this.firstLoad = false;
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
        if (
            this.leftHandSwitch?.nativeElement.checked ||
            this.rightHandSwitch?.nativeElement.checked
        ) {
            this.childComponents
                .filter((child) => !child.motorName.includes("all"))
                .forEach((child) => {
                    if (child.sliderFormControl.value != 0) {
                        child.setSliderValue(0);
                        child.sendAllMessagesCombined();
                    }
                });
        } else {
            this.childComponents
                .filter(
                    (child) =>
                        child.motorName.includes("all") ||
                        child.motorName.includes("opposition"),
                )
                .forEach((child) => {
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

    switchView(swichedPage: boolean) {
        if (!swichedPage) {
            if (this.side === "right") {
                console.log(
                    this.rightHandSwitch?.nativeElement.checked + "---",
                );
                this.logikRight(this.rightHandSwitch?.nativeElement.checked);
                if (this.rightHandSwitch?.nativeElement.checked != undefined) {
                    this.rightHandSwitchSave =
                        this.rightHandSwitch?.nativeElement.checked;
                }
            }
            if (this.side === "left") {
                this.logikLeft(this.leftHandSwitch?.nativeElement.checked);
                if (this.leftHandSwitch?.nativeElement.checked != undefined) {
                    this.leftHandSwitchSave =
                        this.leftHandSwitch?.nativeElement.checked;
                }
            }
        } else {
            if (!this.leftHandSwitchSave && !this.rightHandSwitchSave) {
                this.controllHand();
            } else if (this.side === "left") {
                this.logikLeft(this.leftHandSwitchSave);
            } else {
                this.logikRight(this.rightHandSwitchSave);
            }
        }
    }

    logikLeft(value: boolean) {
        if (value) {
            this.controllFinger();
        } else {
            this.controllHand();
        }
    }

    logikRight(value: boolean) {
        if (value) {
            this.controllFinger();
        } else {
            this.controllHand();
        }
    }

    controllHand() {
        let calledOposite = false;
        this.displayAll = "block";
        this.displayIndividual = "none";
        const indexFinger = this.childComponents.filter(
            (child) => child.labelName === "Index finger",
        )[0];
        this.childComponents.forEach((child) => {
            if (child.labelName != "Thumb opposition") {
                child.sliderFormControl.setValue(
                    indexFinger.sliderFormControl.value,
                );
                child.motorFormControl.setValue(
                    indexFinger.motorFormControl.value,
                );
                child.velocityFormControl.setValue(
                    indexFinger.velocityFormControl.value,
                );
                child.accelerationFormControl.setValue(
                    indexFinger.accelerationFormControl.value,
                );
                child.decelerationFormControl.setValue(
                    indexFinger.decelerationFormControl.value,
                );
                child.periodFormControl.setValue(
                    indexFinger.periodFormControl.value,
                );
                child.pulseMaxRange.setValue(indexFinger.pulseMaxRange.value);
                child.pulseMinRange.setValue(indexFinger.pulseMinRange.value);
                child.degreeMaxFormControl.setValue(
                    indexFinger.degreeMaxFormControl.value,
                );
                child.degreeMinFormControl.setValue(
                    indexFinger.degreeMinFormControl.value,
                );
            }
            if (child.motorName === "all_right_stretch") {
                child.sendAllMessagesCombined();
            }
            if (
                child.motorName.includes("right_opposition") &&
                !calledOposite
            ) {
                calledOposite = true;
                child.sendAllMessagesCombined();
            }
            if (child.motorName === "all_left_stretch") {
                child.sendAllMessagesCombined();
            }
            if (child.motorName.includes("left_opposition") && !calledOposite) {
                calledOposite = true;
                child.sendAllMessagesCombined();
            }
        });
    }

    controllFinger() {
        let calledOposite = false;
        const switchControl =
            this.side === "right"
                ? this.rightHandSwitch?.nativeElement.checked
                : this.leftHandSwitch?.nativeElement.checked;
        console.log("SwitchControl: " + switchControl);
        this.displayAll = "none";
        this.displayIndividual = "block";
        const sliderAll = this.childComponents.filter(
            (child) => child.labelName === "Open/Close all fingers",
        )[0];
        this.childComponents.forEach((child) => {
            if (child.labelName != "Thumb opposition") {
                child.sliderFormControl.setValue(
                    sliderAll.sliderFormControl.value,
                );
            }
        });
        if (this.side === "right") {
            this.childComponents.forEach((child) => {
                if (child.motorName === "all_right_stretch") {
                    child.sendAllMessagesCombined();
                }
                if (
                    child.motorName.includes("right_opposition") &&
                    !calledOposite
                ) {
                    calledOposite = true;
                    child.sendAllMessagesCombined();
                }
            });
        } else {
            this.childComponents.forEach((child) => {
                if (child.motorName === "all_left_stretch") {
                    child.sendAllMessagesCombined();
                }
                if (
                    child.motorName.includes("left_opposition") &&
                    !calledOposite
                ) {
                    calledOposite = true;
                    child.sendAllMessagesCombined();
                }
            });
        }
    }
}
