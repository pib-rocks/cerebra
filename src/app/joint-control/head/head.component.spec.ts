import {HeadComponent} from "./head.component";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {By} from "@angular/platform-browser";
import {MotorControlComponent} from "../motor-control/motor-control.component";
import {ReactiveFormsModule} from "@angular/forms";
import {NavBarComponent} from "../../nav-bar/nav-bar.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {JointTrajectoryMessage} from "../../shared/ros-message-types/jointTrajectoryMessage";
import {Group} from "../../shared/types/motor.enum";
import {MotorService} from "../../shared/services/motor-service/motor.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {HorizontalSliderComponent} from "src/app/sliders/horizontal-slider/horizontal-slider.component";

describe("HeadComponent", () => {
    let component: HeadComponent;
    let fixture: ComponentFixture<HeadComponent>;
    let rosService: RosService;
    let motorService: MotorService;

    let rosSendJointTrajectorySpy: jasmine.Spy<
        (jointTrajectoryMessage: JointTrajectoryMessage) => void
    >;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                HeadComponent,
                MotorControlComponent,
                NavBarComponent,
                HorizontalSliderComponent,
            ],
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule,
            ],
            providers: [RosService],
        }).compileComponents();

        fixture = TestBed.createComponent(HeadComponent);
        component = fixture.componentInstance;
        rosService = TestBed.inject(RosService);
        motorService = TestBed.inject(MotorService);
        fixture.detectChanges();

        rosSendJointTrajectorySpy = spyOn(
            rosService,
            "sendJointTrajectoryMessage",
        ).and.callFake((msg) => rosService.jointTrajectoryReceiver$.next(msg));
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should call reset() and set all slider values to 0 after clicking reset button", () => {
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
            slider.sliderComponent.setAllThumbValues([0]),
        );

        homeButton.click();

        sliders.forEach((slider) =>
            expect(slider.sliderComponent.thumbs[0].value).toBe(10),
        );

        expect(resetSpy).toHaveBeenCalled();
        expect(rosSendJointTrajectorySpy).toHaveBeenCalled();
        expect(motorResetGroupSpy).toHaveBeenCalledWith(Group.head);
    });
});
