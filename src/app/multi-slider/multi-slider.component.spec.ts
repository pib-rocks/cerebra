import {ComponentFixture, TestBed} from "@angular/core/testing";

import {MultiSliderComponent} from "./multi-slider.component";
import {RosService} from "../shared/ros.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Subject} from "rxjs";

describe("MultiSliderComponent", () => {
    let component: MultiSliderComponent;
    let fixture: ComponentFixture<MultiSliderComponent>;
    let rosService: RosService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MultiSliderComponent],
            imports: [ReactiveFormsModule],
            providers: [RosService],
        }).compileComponents();
        rosService = TestBed.inject(RosService);
        fixture = TestBed.createComponent(MultiSliderComponent);
        component = fixture.componentInstance;
        component.messageReceiver$ = new Subject<number[]>();
        component.minValue = -200;
        component.maxValue = 200;
        component.minInit = 20;
        component.maxInit = 80;
        component.ngOnInit();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should change values appropriately for each sliderformcontrol after receiving a message from parent component", () => {
        component.messageReceiver$.next([0, 100]);
        const sfc: FormControl = component.sliderFormControl;
        const sfcUpper: FormControl = component.sliderFormControlUpper;
        fixture.detectChanges();
        expect(sfc.value).toBe(0);
        expect(sfcUpper.value).toBe(100);

        sfc.setValue(110);
        sfcUpper.setValue(30);
        component.messageReceiver$.next([0, 100]);
        fixture.detectChanges();
        expect(sfc.value).toBe(100);
        expect(sfcUpper.value).toBe(0);
    });
});
