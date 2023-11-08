import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {SliderComponent} from "./slider.component";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {BehaviorSubject} from "rxjs";

describe("SliderComponent", () => {
    let component: SliderComponent;
    let fixture: ComponentFixture<SliderComponent>;
    const testSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SliderComponent],
            imports: [ReactiveFormsModule],
            providers: [RosService],
        }).compileComponents();
        fixture = TestBed.createComponent(SliderComponent);
        component = fixture.componentInstance;
        component.messageReceiver$ = testSubject;
        component.minValue = 0;
        component.maxValue = 100;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should change value after receiving a message from RosTopic", () => {
        const slider = fixture.nativeElement.querySelector(
            'input[type="range"]',
        );
        const jsonValue = (component.minValue + component.maxValue) / 2;
        testSubject.next(jsonValue);
        fixture.detectChanges();
        expect(Number(slider.value)).toBe(jsonValue);
    });

    it("should call sendMessage after changing the slider", fakeAsync(() => {
        component.ngOnInit();
        const spyOninputSendMsg = spyOn(component, "inputSendMsg");
        const slider = fixture.nativeElement.querySelector(
            'input[type="range"]',
        );
        slider.value = String((component.minValue + component.maxValue) / 2);
        slider.dispatchEvent(new Event("input"));
        tick(1000);
        fixture.detectChanges();
        expect(spyOninputSendMsg).toHaveBeenCalled();
    }));

    it("should adjust the slider when using textinput on bubble", fakeAsync(() => {
        component.ngOnInit();
        component.ngAfterViewInit();
        const val = String((component.minValue + component.maxValue) / 2);
        component.bubbleFormControl.setValue(val);
        component.bubbleInput = jasmine.createSpyObj(
            "nativeElement",
            {},
            {property: "property"},
        );
        component.bubbleInput.nativeElement = jasmine.createSpyObj(
            "nativeElement",
            {select: "select", focus: "focus"},
        );
        component.sliderInputFromBubble();
        tick(500);
        expect(component.sliderFormControl.value).toBeLessThanOrEqual(
            component.bubbleFormControl.value,
        );
    }));
});
