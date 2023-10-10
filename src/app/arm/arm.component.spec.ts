import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {By} from "@angular/platform-browser";
import {AppRoutingModule} from "../app-routing.module";
import {MotorControlComponent} from "../motor-control/motor-control.component";

import {ArmComponent} from "./arm.component";
import {RosService} from "../shared/ros.service";
import {NavBarComponent} from "../nav-bar/nav-bar.component";
import {RouterTestingModule} from "@angular/router/testing";
import {SliderComponent} from "../slider/slider.component";
import {MotorService} from "../shared/motor.service";
import {Group} from "../shared/types/motor.enum";

describe("ArmComponent", () => {
    let component: ArmComponent;
    let fixture: ComponentFixture<ArmComponent>;
    let rosService: RosService;
    let motorService: MotorService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ArmComponent,
                MotorControlComponent,
                NavBarComponent,
                SliderComponent,
            ],
            imports: [
                AppRoutingModule,
                ReactiveFormsModule,
                RouterTestingModule,
            ],
            providers: [RosService],
        }).compileComponents();

        fixture = TestBed.createComponent(ArmComponent);
        motorService = TestBed.inject(MotorService);
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should create 6 child components that include the slider", () => {
        const childComponents: MotorControlComponent[] = fixture.debugElement
            .queryAll(By.css("app-motor-control"))
            .map((debugElem) => debugElem.componentInstance);
        expect(childComponents.length).toBe(6);
    });

    it("should call reset() and set all slider values to 0 after clicking reset button", () => {
        const childMotorControls = fixture.debugElement.queryAll(
            By.css("app-motor-control"),
        );
        const resetButton = fixture.debugElement.query(
            By.css("#home-position-btn"),
        );
        const clickSpy = spyOn(component, "reset").and.callThrough();

        const motorServiceResetGroupSpy = spyOn(
            motorService,
            "resetMotorGroupPosition",
        ).and.callThrough();

        spyOn(rosService, "sendJointTrajectoryMessage").and.callFake((msg) =>
            rosService.jointTrajectoryReceiver$.next(msg),
        );

        for (const c of childMotorControls) {
            c.componentInstance.sliderComponent.sliderFormControl.setValue(10);
        }
        resetButton.nativeElement.click();
        expect(clickSpy).toHaveBeenCalled();
        expect(motorServiceResetGroupSpy).toHaveBeenCalledWith(Group.right_arm);

        for (const c of childMotorControls) {
            expect(
                c.componentInstance.sliderComponent.sliderFormControl.value,
            ).toBe(0);
        }
    });
});
