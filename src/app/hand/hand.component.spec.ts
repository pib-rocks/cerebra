import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {RouterTestingModule} from "@angular/router/testing";
import {MotorControlComponent} from "../motor-control/motor-control.component";

import {HandComponent} from "./hand.component";
import {RosService} from "../shared/ros.service";
import {NavBarComponent} from "../nav-bar/nav-bar.component";
import {SliderComponent} from "../slider/slider.component";
import {MotorService} from "../shared/motor.service";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {JointTrajectoryMessage} from "../shared/rosMessageTypes/jointTrajectoryMessage";
import {MotorSettingsMessage} from "../shared/motorSettingsMessage";
import {Group} from "../shared/types/motor.enum";

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

    it("should call reset() and set all slider values to 0 after clicking reset button (left)", () => {
        paramsSubject.next({side: "left"});
        if (!component.displayAllFingers)
            fixture.componentInstance.switchView();
        fixture.detectChanges();

        const sliders: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((slider) => slider.componentInstance);

        const resetSpy = spyOn(component, "reset").and.callThrough();
        const motorResetGroupSpy = spyOn(
            motorService,
            "resetMotorGroupPosition",
        ).and.callThrough();
        const homeButton =
            fixture.nativeElement.querySelector("#home-position-btn");

        sliders.forEach((slider) =>
            slider.sliderComponent.sliderFormControl.setValue(10),
        );

        homeButton.click();

        sliders.forEach((slider) =>
            expect(slider.sliderComponent.sliderFormControl.value).toBe(0),
        );

        expect(rosSendJointTrajectorySpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
        expect(motorResetGroupSpy).toHaveBeenCalledWith(Group.left_hand);
    });

    it("should call reset() and set all slider values to 0 after clicking reset button (right)", () => {
        paramsSubject.next({side: "right"});
        if (!component.displayAllFingers)
            fixture.componentInstance.switchView();
        fixture.detectChanges();

        const sliders: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((slider) => slider.componentInstance);

        const resetSpy = spyOn(component, "reset").and.callThrough();
        const motorResetGroupSpy = spyOn(
            motorService,
            "resetMotorGroupPosition",
        ).and.callThrough();
        const homeButton =
            fixture.nativeElement.querySelector("#home-position-btn");

        sliders.forEach((slider) =>
            slider.sliderComponent.sliderFormControl.setValue(10),
        );

        homeButton.click();

        sliders.forEach((slider) =>
            expect(slider.sliderComponent.sliderFormControl.value).toBe(0),
        );

        expect(rosSendJointTrajectorySpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
        expect(motorResetGroupSpy).toHaveBeenCalledWith(Group.right_hand);
    });

    it("should set all values to the index finger value if switched from all to individual", () => {
        paramsSubject.next({side: "right"});
        if (!component.displayAllFingers)
            fixture.componentInstance.switchView();
        fixture.detectChanges();

        expect(fixture.componentInstance.displayAllFingers).toBeTrue();

        const indexPosition = 53;
        const indexMotorCpy = motorService
            .getMotorByName("index_right_stretch")
            .clone();
        expect(indexMotorCpy).toBeTruthy();
        indexMotorCpy.position = indexPosition;
        motorService.updateMotorFromComponent(indexMotorCpy);

        const motorServiceUpdateSpy = spyOn(
            motorService,
            "updateMotorFromJointTrajectoryMessage",
        ).and.callThrough();
        component.switchView();
        fixture.detectChanges();
        expect(motorServiceUpdateSpy).toHaveBeenCalled();

        let motorControls: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((control) => control.componentInstance);
        const allControl = motorControls.find((control) =>
            control.motor.name.includes("all"),
        );
        expect(allControl).toBeTruthy();

        expect(allControl?.sliderComponent.sliderFormControl.value).toBe(
            indexPosition,
        );
        expect(motorService.getMotorByName("all_fingers_right").position).toBe(
            indexPosition,
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

        component.switchView();
        fixture.detectChanges();

        let motorControls: MotorControlComponent[] = fixture.debugElement
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
