import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HardwareIdComponent} from "./hardware-id.component";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {
    DiagnosticsService,
    HardwareConfig,
} from "../diagnostics/diagnostics.service";
import {BehaviorSubject, of, throwError} from "rxjs";
import {Bricklet} from "src/app/shared/types/bricklet";
import {AbstractControl, ReactiveFormsModule} from "@angular/forms";
import {provideZonelessChangeDetection} from "@angular/core";
import {ApiService} from "src/app/shared/services/api.service";
import {
    HardwareContext,
    VariantService,
} from "src/app/shared/services/variant.service";
import {HardwareFeedback} from "src/app/shared/types/hardware-capabilities";

describe("HardwareIdComponent", () => {
    let component: HardwareIdComponent;
    let fixture: ComponentFixture<HardwareIdComponent>;

    let brickletServiceSpy: jasmine.SpyObj<BrickletService>;
    let diagnosticsServiceSpy: jasmine.SpyObj<DiagnosticsService>;
    let hardwareContext: BehaviorSubject<HardwareContext>;

    const bricklet1 = new Bricklet("AAA", 1, "Servo Bricklet");
    const bricklet2 = new Bricklet("BBB", 2, "Servo Bricklet");
    const bricklet3 = new Bricklet("CCC", 3, "Solid State Relay Bricklet");

    const sampleHardwareConfig: HardwareConfig = {
        version: 1,
        bricklets: [
            {
                brickletNumber: 1,
                uid: "29FA",
                type: "Servo Bricklet",
            },
        ],
        motors: [
            {
                name: "head_pan",
                pulseWidthMin: 700,
                pulseWidthMax: 2500,
                brickletPins: [{brickletNumber: 1, pin: 0, invert: false}],
            },
        ],
    };

    beforeEach(async () => {
        brickletServiceSpy = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
            "renameBrickletUid",
            "getBricklet",
            "reloadBrickletsFromDb",
        ]);

        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of([bricklet1, bricklet2, bricklet3]),
        );

        brickletServiceSpy.getBricklet.and.callFake((number: number) => {
            return [bricklet1, bricklet2, bricklet3].find(
                (b) => b.brickletNumber === number,
            );
        });

        diagnosticsServiceSpy = jasmine.createSpyObj("DiagnosticsService", [
            "exportHardwareConfig",
            "importHardwareConfig",
            "downloadHardwareConfig",
            "parseHardwareConfigFileContent",
            "validateHardwareConfig",
        ]);
        hardwareContext = new BehaviorSubject<HardwareContext>({
            variant: {
                variant: "pib5edu",
                source: "fallback",
                supported: [],
                implementedVariants: [],
                seedProfileImplemented: false,
            },
            capabilities: [],
            controllers: [],
            fallback: true,
        });
        const variantServiceSpy = jasmine.createSpyObj("VariantService", [
            "getContextObservable",
            "reload",
        ]);
        variantServiceSpy.getContextObservable.and.returnValue(hardwareContext);

        diagnosticsServiceSpy.exportHardwareConfig.and.returnValue(
            of(sampleHardwareConfig),
        );
        diagnosticsServiceSpy.importHardwareConfig.and.returnValue(
            of(sampleHardwareConfig),
        );
        diagnosticsServiceSpy.parseHardwareConfigFileContent.and.returnValue({
            valid: true,
            config: sampleHardwareConfig,
            errors: [],
            warnings: [],
        });

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HardwareIdComponent],
            providers: [
                {
                    provide: BrickletService,
                    useValue: brickletServiceSpy,
                },
                {
                    provide: DiagnosticsService,
                    useValue: diagnosticsServiceSpy,
                },
                {provide: VariantService, useValue: variantServiceSpy},
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

    it("should render Export and Import Hardware-IDs buttons", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const exportBtn = compiled.querySelector(
            '[data-test="BTN_Export_Hardware_IDs"]',
        ) as HTMLButtonElement;
        const importBtn = compiled.querySelector(
            '[data-test="BTN_Import_Hardware_IDs"]',
        ) as HTMLButtonElement;

        expect(exportBtn).toBeTruthy();
        expect(importBtn).toBeTruthy();
        expect(exportBtn.textContent).toContain("Export IDs");
        expect(importBtn.textContent).toContain("Import IDs");
    });

    it("renders the three pib4edu servo controllers reported by the backend", () => {
        hardwareContext.next(
            contextFor("pib4edu", [
                controller(1, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(2, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(3, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(
                    4,
                    "tinkerforge_bricklet",
                    "Solid State Relay Bricklet",
                    null,
                ),
                controller(
                    5,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
                controller(
                    6,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
                controller(
                    7,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
            ]),
        );
        fixture.detectChanges();

        expect(
            component.servoGroups.flatMap((group) => group.controllers).length,
        ).toBe(3);
        expect(component.relayControllers.length).toBe(1);
        expect(component.rgbControllers.length).toBe(3);
        expect(fixture.nativeElement.textContent).toContain("7.5 V");
    });

    it("groups pib5edu servo controllers by their reported 7.5 V and 12 V supplies", () => {
        hardwareContext.next(
            contextFor("pib5edu", [
                controller(1, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(2, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(3, "tinkerforge_bricklet", "Servo Bricklet", 7.5),
                controller(4, "tinkerforge_bricklet", "Servo Bricklet", 12),
                controller(
                    5,
                    "tinkerforge_bricklet",
                    "Solid State Relay Bricklet",
                    null,
                ),
                controller(
                    6,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
                controller(
                    7,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
                controller(
                    8,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                ),
            ]),
        );
        fixture.detectChanges();

        expect(
            component.servoGroups.flatMap((group) => group.controllers).length,
        ).toBe(4);
        expect(fixture.nativeElement.textContent).toContain("7.5 V");
        expect(fixture.nativeElement.textContent).toContain("12 V");
    });

    it("renders advanced serial device names without Bricklet UID fields", () => {
        hardwareContext.next(
            contextFor("pib5advanced", [
                controller(1, "feetech_st_serial", null, null, "/dev/pib-head"),
                controller(2, "feetech_st_serial", null, null, "/dev/pib-left"),
                controller(
                    3,
                    "feetech_st_serial",
                    null,
                    null,
                    "/dev/pib-right",
                ),
                controller(4, "feetech_st_serial", null, null, "/dev/pib-body"),
            ]),
        );
        fixture.detectChanges();

        expect(
            fixture.nativeElement.querySelectorAll(
                '[data-test^="TXT_Serial_Controller_"]',
            ).length,
        ).toBe(4);
        expect(
            fixture.nativeElement.querySelector(
                '[data-test^="TXT_Bricklet_UID_"]',
            ),
        ).toBeNull();
        expect(Object.keys(component.brickletUidForm.controls).length).toBe(0);
        expect(component.brickletUidForm.valid).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain("/dev/pib-head");
    });

    it("shows the documented museum CAN interface before hardware is available", () => {
        const museumContext = contextFor("pib5museum", []);
        museumContext.capabilities.push({
            kind: "robstride_can",
            installedControllers: 0,
            feedback: [
                "current",
                "target_position",
                "actual_position",
                "temperature",
            ],
            meaningfulSettings: [],
        });
        hardwareContext.next(museumContext);
        fixture.detectChanges();

        const canGroup = fixture.nativeElement.querySelector(
            '[data-test="GRP_CAN_Interface"]',
        );
        expect(canGroup).toBeTruthy();
        expect(canGroup.textContent).toContain("SocketCAN");
        expect(canGroup.textContent).toContain("1 Mbit/s");
        expect(canGroup.textContent).toContain("120 Ω");
    });

    it("should export Hardware-IDs and trigger a JSON download", () => {
        component.exportHardwareIds();

        expect(diagnosticsServiceSpy.exportHardwareConfig).toHaveBeenCalled();
        expect(
            diagnosticsServiceSpy.downloadHardwareConfig,
        ).toHaveBeenCalledWith(sampleHardwareConfig);
        expect(component.importSuccessMessage).toBe(
            "Hardware-IDs exported successfully.",
        );
    });

    it("should open the import modal when Import Hardware-IDs is clicked", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const importBtn = compiled.querySelector(
            '[data-test="BTN_Import_Hardware_IDs"]',
        ) as HTMLButtonElement;

        importBtn.click();
        fixture.detectChanges();

        expect(component.showImportModal).toBeTrue();
        expect(
            compiled.querySelector("#hardware-ids-import-modal"),
        ).toBeTruthy();
    });

    it("should validate selected JSON and show import preview", () => {
        component.openImportModal();
        fixture.detectChanges();

        const fileContent = JSON.stringify(sampleHardwareConfig);
        class MockFileReader {
            result: string | null = null;
            onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
            onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
            readAsText(_file: Blob): void {
                this.result = fileContent;
                this.onload?.({} as ProgressEvent<FileReader>);
            }
        }
        spyOn(window as any, "FileReader").and.returnValue(
            new MockFileReader(),
        );

        const file = new File([fileContent], "hardware-config.json", {
            type: "application/json",
        });
        const event = {
            target: {files: [file], value: "hardware-config.json"},
        } as unknown as Event;

        component.onHardwareImportFileSelected(event);
        fixture.detectChanges();

        expect(
            diagnosticsServiceSpy.parseHardwareConfigFileContent,
        ).toHaveBeenCalledWith(fileContent);
        expect(component.importPreview).toEqual(sampleHardwareConfig);
        expect(component.importErrors).toEqual([]);

        const compiled = fixture.nativeElement as HTMLElement;
        expect(
            compiled.querySelector("#table-import-preview-bricklets"),
        ).toBeTruthy();
    });

    it("should surface validation errors from invalid import files", () => {
        diagnosticsServiceSpy.parseHardwareConfigFileContent.and.returnValue({
            valid: false,
            errors: ["Duplicate Bricklet UID assignment: '29FA'"],
            warnings: [],
        });

        const result =
            diagnosticsServiceSpy.parseHardwareConfigFileContent("{}");
        component.importErrors = result.errors;
        component.importWarnings = result.warnings;
        component.importPreview = result.valid ? result.config ?? null : null;
        component.showImportModal = true;
        fixture.detectChanges();

        expect(component.importPreview).toBeNull();
        expect(component.importErrors).toEqual([
            "Duplicate Bricklet UID assignment: '29FA'",
        ]);
    });

    it("should confirm import via DiagnosticsService and close the modal", () => {
        component.openImportModal();
        component.importPreview = sampleHardwareConfig;
        component.confirmHardwareImport();

        expect(diagnosticsServiceSpy.importHardwareConfig).toHaveBeenCalledWith(
            sampleHardwareConfig,
        );
        expect(brickletServiceSpy.reloadBrickletsFromDb).toHaveBeenCalled();
        expect(component.showImportModal).toBeFalse();
        expect(component.importSuccessMessage).toBe(
            "Hardware-IDs imported successfully.",
        );
    });

    it("should surface server validation errors when import fails", () => {
        diagnosticsServiceSpy.importHardwareConfig.and.returnValue(
            throwError(() => ({
                error: {error: "Duplicate Bricklet UID assignment: '29FA'"},
            })),
        );

        component.openImportModal();
        component.importPreview = sampleHardwareConfig;
        component.confirmHardwareImport();

        expect(component.importErrors).toEqual([
            "Duplicate Bricklet UID assignment: '29FA'",
        ]);
        expect(component.showImportModal).toBeTrue();
    });
});

function controller(
    number: number,
    kind: string,
    deviceType: string | null,
    supplyVoltage: number | null,
    address = `UID${number}`,
) {
    return {number, kind, deviceType, supplyVoltage, address};
}

function contextFor(
    variant: string,
    controllers: ReturnType<typeof controller>[],
): HardwareContext {
    const counts = new Map<string, number>();
    controllers.forEach((item) =>
        counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1),
    );
    return {
        variant: {
            variant,
            source: "database",
            supported: [variant],
            implementedVariants: [variant],
            seedProfileImplemented: true,
        },
        capabilities: Array.from(counts, ([kind, installedControllers]) => ({
            kind,
            installedControllers,
            feedback:
                kind === "tinkerforge_bricklet"
                    ? (["current", "target_position"] as HardwareFeedback[])
                    : ([
                          "current",
                          "target_position",
                          "actual_position",
                          "temperature",
                      ] as HardwareFeedback[]),
            meaningfulSettings: [],
        })),
        controllers,
        fallback: false,
    };
}

describe("HardwareIdComponent import preview (zoneless)", () => {
    let component: HardwareIdComponent;
    let fixture: ComponentFixture<HardwareIdComponent>;

    // Payload shape produced by pib-backend export_hardware_config().
    const exportedFileContent = JSON.stringify(
        {
            version: 1,
            bricklets: [
                {brickletNumber: 1, uid: "TESTab", type: "Servo Bricklet"},
                {brickletNumber: 2, uid: "", type: "Servo Bricklet"},
            ],
            motors: [
                {
                    name: "elbow_left",
                    pulseWidthMin: 700,
                    pulseWidthMax: 2500,
                    rotationRangeMin: -9000,
                    rotationRangeMax: 9000,
                    velocity: 16000,
                    acceleration: 10000,
                    deceleration: 5000,
                    period: 19500,
                    turnedOn: true,
                    visible: true,
                    invert: false,
                    brickletPins: [{brickletNumber: 1, pin: 8, invert: false}],
                },
            ],
        },
        null,
        2,
    );

    beforeEach(async () => {
        const brickletServiceSpy = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
            "renameBrickletUid",
            "getBricklet",
            "reloadBrickletsFromDb",
        ]);
        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of([new Bricklet("AAA", 1, "Servo Bricklet")]),
        );
        const variantServiceSpy = jasmine.createSpyObj("VariantService", [
            "getContextObservable",
            "reload",
        ]);
        variantServiceSpy.getContextObservable.and.returnValue(
            of({
                variant: {
                    variant: "pib5edu",
                    source: "fallback",
                    supported: [],
                    implementedVariants: [],
                    seedProfileImplemented: false,
                },
                capabilities: [],
                controllers: [],
                fallback: true,
            }),
        );

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HardwareIdComponent],
            providers: [
                provideZonelessChangeDetection(),
                {provide: BrickletService, useValue: brickletServiceSpy},
                {provide: VariantService, useValue: variantServiceSpy},
                // Real DiagnosticsService so the exported JSON is really parsed.
                DiagnosticsService,
                {
                    provide: ApiService,
                    useValue: jasmine.createSpyObj("ApiService", [
                        "get",
                        "post",
                    ]),
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HardwareIdComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("renders the import preview for a re-imported export without an extra change detection run", async () => {
        component.openImportModal();
        await fixture.whenStable();

        class MockFileReader {
            result: string | null = null;
            onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
            onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
            readAsText(): void {
                this.result = exportedFileContent;
                this.onload?.({} as ProgressEvent<FileReader>);
            }
        }
        spyOn(
            window as unknown as {FileReader: unknown},
            "FileReader" as never,
        ).and.returnValue(new MockFileReader() as never);

        const file = new File([exportedFileContent], "hardware-config.json", {
            type: "application/json",
        });
        component.onHardwareImportFileSelected({
            target: {files: [file], value: "hardware-config.json"},
        } as unknown as Event);

        await fixture.whenStable();

        const compiled = fixture.nativeElement as HTMLElement;
        const preview = compiled.querySelector(".import-preview");
        expect(preview).toBeTruthy();
        expect(preview?.textContent).toContain("TESTab");

        const confirmBtn = compiled.querySelector(
            '[data-test="BTN_Import_Hardware_IDs_Confirm"]',
        ) as HTMLButtonElement;
        expect(confirmBtn.disabled).toBeFalse();
    });
});
