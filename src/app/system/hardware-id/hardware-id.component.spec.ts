import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HardwareIdComponent} from "./hardware-id.component";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {of} from "rxjs";
import {Bricklet} from "src/app/shared/types/bricklet";
import {AbstractControl, ReactiveFormsModule} from "@angular/forms";

describe("HardwareIdComponent", () => {
    let component: HardwareIdComponent;
    let fixture: ComponentFixture<HardwareIdComponent>;

    let brickletServiceSpy: jasmine.SpyObj<BrickletService>;

    const bricklet1 = new Bricklet("AAA", 1, "Servo Bricklet");
    const bricklet2 = new Bricklet("BBB", 2, "Servo Bricklet");
    const bricklet3 = new Bricklet("CCC", 3, "Solid State Relay Bricklet");

    beforeEach(async () => {
        brickletServiceSpy = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
            "renameBrickletUid",
            "getBricklet",
        ]);

        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of([bricklet1, bricklet2, bricklet3]),
        );

        brickletServiceSpy.getBricklet.and.callFake((number: number) => {
            return [bricklet1, bricklet2, bricklet3].find(
                (b) => b.brickletNumber === number,
            );
        });

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [HardwareIdComponent],
            providers: [
                {
                    provide: BrickletService,
                    useValue: brickletServiceSpy,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HardwareIdComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its bricklets from the service and initialize the form", () => {
        expect(brickletServiceSpy.getBrickletObservable).toHaveBeenCalled();

        expect(component.brickletUidForm.contains("1")).toBeTrue();
        expect(component.brickletUidForm.contains("2")).toBeTrue();
        expect(component.brickletUidForm.contains("3")).toBeTrue();

        const control1 = component.brickletUidForm.get("1") as AbstractControl;
        const control2 = component.brickletUidForm.get("2") as AbstractControl;
        const control3 = component.brickletUidForm.get("3") as AbstractControl;

        expect(control1.value).toBe("AAA");
        expect(control2.value).toBe("BBB");
        expect(control3.value).toBe("CCC");
    });

    it("should call renameBrickletUid when the form is valid", () => {
        component.brickletUidForm.setValue({
            "1": "NEW1",
            "2": "NEW2",
            "3": "NEW3",
        });

        component.updateIds();

        expect(brickletServiceSpy.renameBrickletUid).toHaveBeenCalledOnceWith(
            jasmine.arrayWithExactContents([
                jasmine.objectContaining({
                    brickletNumber: 1,
                    uid: "NEW1",
                    type: "Servo Bricklet",
                }),
                jasmine.objectContaining({
                    brickletNumber: 2,
                    uid: "NEW2",
                    type: "Servo Bricklet",
                }),
                jasmine.objectContaining({
                    brickletNumber: 3,
                    uid: "NEW3",
                    type: "Solid State Relay Bricklet",
                }),
            ]),
        );
    });

    it("should not call renameBrickletUid if the form is invalid", () => {
        component.brickletUidForm.setValue({
            "1": "1234567", // UID too long
            "2": "NEW2",
            "3": "NEW3",
        });

        component.updateIds();

        expect(brickletServiceSpy.renameBrickletUid).not.toHaveBeenCalled();
    });

    it("should not call renameBrickletUid when no uids have changed", () => {
        // no uid change
        component.updateIds();

        expect(brickletServiceSpy.renameBrickletUid).not.toHaveBeenCalled();
    });

    it("should call renameBrickletUid with only the changed bricklets", () => {
        component.brickletUidForm.setValue({
            "1": "AAA",
            "2": "NEW",
            "3": "CCC",
        });

        component.updateIds();

        expect(brickletServiceSpy.renameBrickletUid).toHaveBeenCalledOnceWith(
            jasmine.arrayWithExactContents([
                jasmine.objectContaining({
                    brickletNumber: 2,
                    uid: "NEW",
                    type: "Servo Bricklet",
                }),
            ]),
        );
    });
});
