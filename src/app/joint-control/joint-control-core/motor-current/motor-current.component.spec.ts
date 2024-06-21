import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MotorCurrentComponent} from "./motor-current.component";
import {MotorPositionComponent} from "../motor-position/motor-position.component";
import {Renderer2} from "@angular/core";
import {MotorService} from "src/app/shared/services/motor.service";
import {Subject} from "rxjs";

describe("MotorCurrentComponent", () => {
    let component: MotorCurrentComponent;
    let fixture: ComponentFixture<MotorCurrentComponent>;

    let motorService: jasmine.SpyObj<MotorService>;
    let renderer: jasmine.SpyObj<Renderer2>;

    let currentSubject: Subject<number>;

    beforeEach(async () => {
        const motorServiceSpy: jasmine.SpyObj<MotorService> =
            jasmine.createSpyObj("MotorService", ["getCurrentObservable"]);
        currentSubject = new Subject();
        motorServiceSpy.getCurrentObservable.and.returnValue(currentSubject);

        await TestBed.configureTestingModule({
            declarations: [MotorPositionComponent],
            providers: [
                {
                    provide: MotorService,
                    useValue: motorServiceSpy,
                },
                {
                    provide: Renderer2,
                },
            ],
        }).compileComponents();

        motorService = TestBed.inject(
            MotorService,
        ) as jasmine.SpyObj<MotorService>;
        renderer = TestBed.inject(Renderer2) as jasmine.SpyObj<Renderer2>;

        fixture = TestBed.createComponent(MotorCurrentComponent);
        component = fixture.componentInstance;
        component.motor = {
            motorName: "test_motor",
            motorPathName: "test-motor",
            label: "Test Motor",
            sliderIconLeft: "/path-to-icon",
            sliderIconRight: "/path-to-icon",
            captionLeft: "left",
            captionRight: "right",
            touchPointCenterX: 0.2,
            touchPointCenterY: 0.3,
            isMultiMotor: true,
            sourceMotorName: "test_motor",
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
        expect(motorService.getCurrentObservable).toHaveBeenCalledTimes(1);
    });

    it("should set the style", () => {
        component.maxValue = 200;
        component.minValue = 100;
        component.CIRCUMFERENCE = 2;
        const setStyleSpy = spyOn(component["renderer"], "setStyle");
        currentSubject.next(20);
        expect(component.currentValue).toBe(20);
        expect(setStyleSpy).toHaveBeenCalledOnceWith(
            jasmine.any(Object),
            "strokeDasharray",
            "0.4, 360",
        );
    });
});
