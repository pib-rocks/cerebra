import {ComponentFixture, TestBed} from "@angular/core/testing";

import {RgbLedButtonComponent} from "./rgb-led-button.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {RgbLedButtonService} from "src/app/shared/services/rgb-led-button.service";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {of} from "rxjs";
import {Bricklet} from "src/app/shared/types/bricklet";

describe("RgbLedButtonComponent", () => {
    let component: RgbLedButtonComponent;
    let fixture: ComponentFixture<RgbLedButtonComponent>;
    let programServiceSpy: jasmine.SpyObj<ProgramService>;
    let brickletServiceSpy: jasmine.SpyObj<BrickletService>;
    let rgbLedButtonServiceSpy: jasmine.SpyObj<RgbLedButtonService>;
    let matSnackbarServiceSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
        programServiceSpy = jasmine.createSpyObj("ProgramService", {
            getAllPrograms: of([]),
        });
        brickletServiceSpy = jasmine.createSpyObj("BrickletService", {
            getBrickletObservable: of([]),
        });
        rgbLedButtonServiceSpy = jasmine.createSpyObj("RgbLedButtonService", {
            getButtonPrograms: of([]),
            updateButtonPrograms: of([]),
        });
        matSnackbarServiceSpy = jasmine.createSpyObj("MatSnackBar", ["open"]);

        await TestBed.configureTestingModule({
            declarations: [RgbLedButtonComponent],
            imports: [ReactiveFormsModule],
            providers: [
                {provide: ProgramService, useValue: programServiceSpy},
                {provide: BrickletService, useValue: brickletServiceSpy},
                {
                    provide: RgbLedButtonService,
                    useValue: rgbLedButtonServiceSpy,
                },
                {provide: MatSnackBar, useValue: matSnackbarServiceSpy},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RgbLedButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the rgb led button bricklets", () => {
        const mockBricklets = [
            new Bricklet("uid1", 1, "RGB LED Button Bricklet"),
            new Bricklet("uid2", 2, "Servo Bricklet"),
            new Bricklet("uid3", 3, "RGB LED Button Bricklet"),
            new Bricklet("uid4", 4, "Solid State Relay Bricklet"),
        ];
        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of(mockBricklets),
        );
        component.ngOnInit();
        expect(component.buttons.length).toBe(2);
        expect(component.buttons[0].brickletNumber).toBe(1);
        expect(component.buttons[1].brickletNumber).toBe(3);
    });

    it("should get all programs on init", () => {
        component.ngOnInit();
        expect(programServiceSpy.getAllPrograms).toHaveBeenCalled();
    });

    it("should get button programs and initialize form controls", () => {
        const mockBricklets = [
            new Bricklet("uid1", 1, "RGB LED Button Bricklet"),
            new Bricklet("uid2", 2, "RGB LED Button Bricklet"),
        ];
        const mockButtonPrograms = [
            {brickletNumber: 1, programNumber: "uuid1"},
            {brickletNumber: 2, programNumber: null},
        ];
        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of(mockBricklets),
        );
        rgbLedButtonServiceSpy.getButtonPrograms.and.returnValue(
            of(mockButtonPrograms),
        );
        component.ngOnInit();

        expect(rgbLedButtonServiceSpy.getButtonPrograms).toHaveBeenCalled();
        expect(component.ledConfigForm.contains("1")).toBeTrue();
        expect(component.ledConfigForm.contains("2")).toBeTrue();
        expect(
            (
                component.ledConfigForm.controls as Record<
                    string,
                    FormControl<string | null>
                >
            )["1"].value,
        ).toBe("uuid1");
        expect(
            (
                component.ledConfigForm.controls as Record<
                    string,
                    FormControl<string | null>
                >
            )["2"].value,
        ).toBeNull();
    });

    it("should update button programs", () => {
        const mockBricklets = [
            new Bricklet("uid1", 1, "RGB LED Button Bricklet"),
            new Bricklet("uid2", 2, "RGB LED Button Bricklet"),
        ];
        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of(mockBricklets),
        );
        component.ngOnInit();
        (
            component.ledConfigForm.controls as Record<
                string,
                FormControl<string | null>
            >
        )["1"].setValue("new-uuid1");
        (
            component.ledConfigForm.controls as Record<
                string,
                FormControl<string | null>
            >
        )["2"].setValue("new-uuid2");
        component.updateConfig();
        expect(
            rgbLedButtonServiceSpy.updateButtonPrograms,
        ).toHaveBeenCalledWith([
            {brickletNumber: 1, programNumber: "new-uuid1"},
            {brickletNumber: 2, programNumber: "new-uuid2"},
        ]);
        expect(matSnackbarServiceSpy.open).toHaveBeenCalledWith(
            "Button programs updated successfully",
            "",
            {
                panelClass: "cerebra-toast",
                duration: 3000,
            },
        );
    });
});
