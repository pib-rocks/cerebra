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

describe("ArmComponent", () => {
    let component: ArmComponent;
    let fixture: ComponentFixture<ArmComponent>;
    let rosService: RosService;

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
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should create 6 child components that include the slider", () => {
        component.side = "left";
        fixture.detectChanges();
        const childComponents =
            fixture.nativeElement.querySelectorAll("app-motor-control");
        console.log(childComponents);
        expect(childComponents.length).toBe(6);
    });

    it("should call reset() and set all slider values to 0 after clicking reset button", () => {
        component.side = "left";
        fixture.detectChanges();
        const childComponents = fixture.debugElement.queryAll(
            By.css("app-motor-control"),
        );
        for (const childComponent of childComponents) {
            spyOn(
                childComponent.componentInstance,
                "sendJointTrajectoryMessage",
            );
        }
        const button = fixture.debugElement.query(By.css("#home-position-btn"));
        console.log(button);
        const clickSpy = spyOn(component, "reset").and.callThrough();
        for (const c of childComponents) {
            c.componentInstance.sliderFormControl.setValue(10);
        }
        button.nativeElement.click();
        expect(clickSpy).toHaveBeenCalled();
        for (const child of childComponents) {
            expect(child.componentInstance.sliderFormControl.value).toBe(0);
        }
        for (const spy of childComponents) {
            expect(
                spy.componentInstance.sendJointTrajectoryMessage,
            ).toHaveBeenCalled();
        }
    });
    it("should send dummy values", () => {
        component.side = "left";
        fixture.detectChanges();
        const dummyBtnLEft = fixture.debugElement.query(
            By.css("#dummyBtnLeft"),
        );
        spyOn(rosService, "sendSliderMessage");
        dummyBtnLEft.nativeElement.click();
        expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(6);

        component.side = "right";
        fixture.detectChanges();
        const dummyBtnRight = fixture.debugElement.query(
            By.css("#dummyBtnRight"),
        );
        dummyBtnRight.nativeElement.click();
        expect(rosService.sendSliderMessage).toHaveBeenCalledTimes(12);
    });
});
