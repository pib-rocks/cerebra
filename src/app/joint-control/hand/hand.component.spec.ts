import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {RouterTestingModule} from "@angular/router/testing";
import {MotorControlComponent} from "../motor-control/motor-control.component";

import {HandComponent} from "./hand.component";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {NavBarComponent} from "../../nav-bar/nav-bar.component";
import {CircularSliderComponent} from "../circular-slider/circular-slider.component";
import {SliderComponent} from "../../sliders/slider/slider.component";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {JointTrajectoryMessage} from "../../shared/ros-message-types/jointTrajectoryMessage";
import {MotorSettingsMessage} from "../../shared/ros-message-types/motorSettingsMessage";
import {Group} from "../../shared/types/motor.enum";

describe("HandComponent", () => {
    let component: HandComponent;
    let fixture: ComponentFixture<HandComponent>;
    let rosService: RosService;
    let motorService: MotorService;

    let rosSendJointTrajectorySpy: jasmine.Spy<
        (jointTrajectoryMessage: JointTrajectoryMessage) => void
    >;
    let rosSendMotorSettingsSpy: jasmine.Spy<
        (jointTrajectoryMessage: MotorSettingsMessage) => void
    >;

    const paramsSubject = new BehaviorSubject({
        side: "right",
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                HandComponent,
                MotorControlComponent,
                NavBarComponent,
                CircularSliderComponent,
                SliderComponent,
            ],
            imports: [RouterTestingModule, ReactiveFormsModule],
            providers: [
                RosService,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: paramsSubject,
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HandComponent);
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);
        motorService = TestBed.inject(MotorService);
        fixture.detectChanges();

        rosSendJointTrajectorySpy = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callFake((msg) => rosService.jointTrajectoryReceiver$.next(msg));
        rosSendMotorSettingsSpy = spyOn(
            rosService,
            "sendMotorSettingsMessage",
        ).and.callFake((msg) => rosService.motorSettingsReceiver$.next(msg));
    });

    afterEach(() => {
        fixture.destroy();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should replace motor-controls when switching view the sliders (left)", () => {
        paramsSubject.next({side: "left"});
        if (component.displayAllFingers) fixture.componentInstance.switchView();
        fixture.detectChanges();
        expect(!fixture.componentInstance.displayAllFingers).toBeTrue();

        let motorControls: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        let motorNames: string[] = motorControls.map((comp) => comp.motor.name);
        expect(motorNames).toEqual(
            jasmine.arrayWithExactContents([
                "thumb_left_opposition",
                "all_fingers_left",
            ]),
        );

        fixture.componentInstance.switchView();
        fixture.detectChanges();
        expect(fixture.componentInstance.displayAllFingers).toBeTrue();

        motorControls = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        motorNames = motorControls.map((comp) => comp.motor.name);
        expect(motorNames).toEqual(
            jasmine.arrayWithExactContents([
                "thumb_left_opposition",
                "thumb_left_stretch",
                "index_left_stretch",
                "middle_left_stretch",
                "ring_left_stretch",
                "pinky_left_stretch",
            ]),
        );
    });

    it("should replace motor-controls when switching view (right)", () => {
        paramsSubject.next({side: "right"});
        if (component.displayAllFingers) fixture.componentInstance.switchView();
        fixture.detectChanges();
        expect(!fixture.componentInstance.displayAllFingers).toBeTrue();

        let motorControls: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        let motorNames: string[] = motorControls.map((comp) => comp.motor.name);
        expect(motorNames).toEqual(
            jasmine.arrayWithExactContents([
                "thumb_right_opposition",
                "all_fingers_right",
            ]),
        );

        fixture.componentInstance.switchView();
        fixture.detectChanges();
        expect(fixture.componentInstance.displayAllFingers).toBeTrue();

        motorControls = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        motorNames = motorControls.map((comp) => comp.motor.name);
        expect(motorNames).toEqual(
            jasmine.arrayWithExactContents([
                "thumb_right_opposition",
                "thumb_right_stretch",
                "index_right_stretch",
                "middle_right_stretch",
                "ring_right_stretch",
                "pinky_right_stretch",
            ]),
        );
    });

    it("should call reset() and set all slider values to 0 after clicking reset button", () => {
        paramsSubject.next({side: "right"});
        if (!component.displayAllFingers)
            fixture.componentInstance.switchView();
        fixture.detectChanges();

        const sliders: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((slider) => slider.componentInstance);
        sliders.forEach((slider) =>
            slider.sliderComponent.sliderFormControl.setValue(10),
        );

        const resetSpy = spyOn(component, "reset").and.callThrough();
        const motorResetGroupSpy = spyOn(
            motorService,
            "resetMotorGroupPosition",
        ).and.callThrough();

        const homeButton =
            fixture.nativeElement.querySelector("#home-position-btn");
        homeButton.click();

        expect(resetSpy).toHaveBeenCalled();
        expect(motorResetGroupSpy).toHaveBeenCalledWith(Group.right_hand);
        expect(rosSendJointTrajectorySpy).toHaveBeenCalled();
        sliders.forEach((slider) =>
            expect(slider.sliderComponent.sliderFormControl.value).toBe(0),
        );
    });

    it("should set all_fingers value to the index finger value if switched from all to individual", () => {
        paramsSubject.next({side: "right"});
        if (!component.displayAllFingers)
            fixture.componentInstance.switchView();
        fixture.detectChanges();
        expect(fixture.componentInstance.displayAllFingers).toBeTrue();

        const indexPos = 10;
        const otherPos = 0;
        motorService
            .getMotorsByGroup(Group.right_hand)
            .map((motor) => motor.clone())
            .forEach((motorClone) => {
                motorClone.position =
                    motorClone.name == "index_right_stretch"
                        ? indexPos
                        : otherPos;
                motorService.updateMotorFromComponent(motorClone);
            });

        const motorSendJointTrajectorySpy = spyOn(
            motorService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const motorMotorSettingsSpy = spyOn(
            motorService,
            "sendMotorSettingsMessage",
        ).and.callThrough();

        component.switchView();
        fixture.detectChanges();

        const expectedMotorObj = jasmine.objectContaining({
            name: "all_fingers_right",
            position: indexPos,
        });
        expect(motorSendJointTrajectorySpy).toHaveBeenCalledOnceWith(
            expectedMotorObj,
        );
        expect(motorMotorSettingsSpy).toHaveBeenCalledOnceWith(
            expectedMotorObj,
        );

        expect(rosSendMotorSettingsSpy).toHaveBeenCalled;

        const motorControls: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        const allControl = motorControls.find(
            (mc) => mc.motor.name == "all_fingers_right",
        );
        const oppositionControl = motorControls.find(
            (mc) => mc.motor.name == "thumb_right_opposition",
        );
        expect(allControl?.sliderComponent.sliderFormControl.value).toBe(
            indexPos,
        );
        expect(oppositionControl?.sliderComponent.sliderFormControl.value).toBe(
            otherPos,
        );

        motorService
            .getMotorsByGroup(Group.right_hand)
            .forEach((motor) =>
                expect(motor.position).toBe(
                    motor.name == "thumb_right_opposition"
                        ? otherPos
                        : indexPos,
                ),
            );
    });

    it("should set all values to the value of the all_fingers slider", () => {
        paramsSubject.next({side: "right"});
        if (component.displayAllFingers) fixture.componentInstance.switchView();
        fixture.detectChanges();

        expect(!fixture.componentInstance.displayAllFingers).toBeTrue();

        const allPosition = 10;
        const allMotorCpy = motorService
            .getMotorByName("all_fingers_right")
            .clone();
        expect(allMotorCpy).toBeTruthy();
        allMotorCpy.position = allPosition;
        motorService.updateMotorFromComponent(allMotorCpy);

        const motorSendJointTrajectorySpy = spyOn(
            motorService,
            "sendJointTrajectoryMessage",
        ).and.callThrough();
        const motorMotorSettingsSpy = spyOn(
            motorService,
            "sendMotorSettingsMessage",
        ).and.callThrough();

        component.switchView();
        fixture.detectChanges();

        expect(motorSendJointTrajectorySpy).not.toHaveBeenCalled();
        expect(motorMotorSettingsSpy).not.toHaveBeenCalled();

        const motorControls: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((control) => control.componentInstance);
        expect(motorControls.length).toBe(6);

        motorControls
            .map((mc) => mc.motor.name)
            .filter((motorName) => !motorName.includes("opposition"))
            .map((motorName) => motorService.getMotorByName(motorName))
            .forEach((motor) => expect(motor.position).toBe(allPosition));
        motorControls
            .filter((mc) => !mc.motor.name.includes("opposition"))
            .forEach((mc) =>
                expect(mc.sliderComponent.sliderFormControl.value).toBe(
                    allPosition,
                ),
            );
    });
});
