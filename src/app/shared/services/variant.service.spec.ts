import {TestBed} from "@angular/core/testing";
import {MatSnackBar} from "@angular/material/snack-bar";
import {of, throwError} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {HardwareContext, VariantService} from "./variant.service";

describe("VariantService", () => {
    let apiService: jasmine.SpyObj<ApiService>;
    let snackBar: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        apiService = jasmine.createSpyObj("ApiService", ["get"]);
        snackBar = jasmine.createSpyObj("MatSnackBar", ["open"]);

        TestBed.configureTestingModule({
            providers: [
                VariantService,
                {provide: ApiService, useValue: apiService},
                {provide: MatSnackBar, useValue: snackBar},
            ],
        });
    });

    it("loads the variant, capabilities, and installed controllers", () => {
        apiService.get.withArgs(UrlConstants.HARDWARE_VARIANT).and.returnValue(
            of({
                variant: "pib5advanced",
                source: "database",
                supported: ["pib5advanced"],
                implementedVariants: ["pib5advanced"],
                seedProfileImplemented: true,
            }),
        );
        apiService.get
            .withArgs(UrlConstants.HARDWARE_CAPABILITIES)
            .and.returnValue(
                of({
                    capabilities: [
                        {
                            kind: "feetech_st_serial",
                            installedControllers: 1,
                            feedback: [
                                "current",
                                "actual_position",
                                "temperature",
                            ],
                            meaningfulSettings: ["velocity"],
                        },
                    ],
                }),
            );
        apiService.get.withArgs(UrlConstants.CONTROLLER).and.returnValue(
            of({
                controllers: [
                    {
                        kind: "feetech_st_serial",
                        deviceType: null,
                        address: "/dev/pib-head",
                        number: 1,
                        supplyVoltage: null,
                    },
                ],
            }),
        );

        const service = TestBed.inject(VariantService);
        let context: HardwareContext | undefined;
        let hasTemperature = false;
        let installedKinds: string[] = [];
        service.getContextObservable().subscribe((value) => (context = value));
        service
            .hasFeedback("temperature")
            .subscribe((value) => (hasTemperature = value));
        service
            .getInstalledControllerKinds()
            .subscribe((value) => (installedKinds = value));

        expect(context).toEqual(
            jasmine.objectContaining({
                fallback: false,
                controllers: [
                    jasmine.objectContaining({address: "/dev/pib-head"}),
                ],
            }),
        );
        expect(hasTemperature).toBeTrue();
        expect(installedKinds).toEqual(["feetech_st_serial"]);
        expect(apiService.get).toHaveBeenCalledWith(
            UrlConstants.HARDWARE_VARIANT,
        );
        expect(apiService.get).toHaveBeenCalledWith(
            UrlConstants.HARDWARE_CAPABILITIES,
        );
    });

    it("warns and falls back to educational capabilities on HTTP error", () => {
        spyOn(console, "warn");
        apiService.get.and.returnValue(throwError(() => new Error("offline")));

        const service = TestBed.inject(VariantService);
        let context: HardwareContext | undefined;
        let hasActualPosition = true;
        service.getContextObservable().subscribe((value) => (context = value));
        service
            .hasFeedback("actual_position")
            .subscribe((value) => (hasActualPosition = value));

        expect(context).toEqual(
            jasmine.objectContaining({
                fallback: true,
                capabilities: [
                    jasmine.objectContaining({
                        kind: "tinkerforge_bricklet",
                        feedback: ["current", "target_position"],
                    }),
                ],
            }),
        );
        expect(hasActualPosition).toBeFalse();
        expect(console.warn).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalled();
    });

    it("hasMeaningfulSetting uses installed controllers when present", () => {
        apiService.get.withArgs(UrlConstants.HARDWARE_VARIANT).and.returnValue(
            of({
                variant: "pib5advanced",
                source: "database",
                supported: ["pib5advanced"],
                implementedVariants: ["pib5advanced"],
                seedProfileImplemented: true,
            }),
        );
        apiService.get
            .withArgs(UrlConstants.HARDWARE_CAPABILITIES)
            .and.returnValue(
                of({
                    capabilities: [
                        {
                            kind: "feetech_st_serial",
                            installedControllers: 1,
                            feedback: ["actual_position"],
                            meaningfulSettings: [
                                "velocity",
                                "zero_calibration",
                            ],
                        },
                    ],
                }),
            );
        apiService.get
            .withArgs(UrlConstants.CONTROLLER)
            .and.returnValue(of({controllers: []}));

        const service = TestBed.inject(VariantService);
        let hasZeroCalibration = false;
        let hasPulseWidth = true;
        service
            .hasMeaningfulSetting("zero_calibration")
            .subscribe((value) => (hasZeroCalibration = value));
        service
            .hasMeaningfulSetting("pulse_width")
            .subscribe((value) => (hasPulseWidth = value));

        expect(hasZeroCalibration).toBeTrue();
        expect(hasPulseWidth).toBeFalse();
    });

    it("hasMeaningfulSetting falls back to all capabilities and classic PWM settings", () => {
        spyOn(console, "warn");
        apiService.get.and.returnValue(throwError(() => new Error("offline")));

        const service = TestBed.inject(VariantService);
        let hasPulseWidth = false;
        let hasZeroCalibration = true;
        service
            .hasMeaningfulSetting("pulse_width")
            .subscribe((value) => (hasPulseWidth = value));
        service
            .hasMeaningfulSetting("zero_calibration")
            .subscribe((value) => (hasZeroCalibration = value));

        expect(hasPulseWidth).toBeTrue();
        expect(hasZeroCalibration).toBeFalse();
    });

    it("hasMeaningfulSetting treats empty meaningfulSettings as classic PWM sliders", () => {
        apiService.get.withArgs(UrlConstants.HARDWARE_VARIANT).and.returnValue(
            of({
                variant: "pib5edu",
                source: "database",
                supported: ["pib5edu"],
                implementedVariants: ["pib5edu"],
                seedProfileImplemented: true,
            }),
        );
        apiService.get
            .withArgs(UrlConstants.HARDWARE_CAPABILITIES)
            .and.returnValue(
                of({
                    capabilities: [
                        {
                            kind: "tinkerforge_bricklet",
                            installedControllers: 1,
                            feedback: ["current"],
                            meaningfulSettings: [],
                        },
                    ],
                }),
            );
        apiService.get
            .withArgs(UrlConstants.CONTROLLER)
            .and.returnValue(of({controllers: []}));

        const service = TestBed.inject(VariantService);
        let hasDeceleration = false;
        let hasTorqueLimit = true;
        service
            .hasMeaningfulSetting("deceleration")
            .subscribe((value) => (hasDeceleration = value));
        service
            .hasMeaningfulSetting("torque_limit")
            .subscribe((value) => (hasTorqueLimit = value));

        expect(hasDeceleration).toBeTrue();
        expect(hasTorqueLimit).toBeFalse();
    });
});
