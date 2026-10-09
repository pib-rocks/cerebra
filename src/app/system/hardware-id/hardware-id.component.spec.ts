import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HardwareIdComponent} from "./hardware-id.component";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {
    DiagnosticsService,
    HardwareConfig,
} from "../diagnostics/diagnostics.service";
import {BehaviorSubject, of, Subject, throwError} from "rxjs";
import {Bricklet} from "src/app/shared/types/bricklet";
import {ConnectedBricklet} from "src/app/shared/types/connected-bricklet";
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

    // Shape of GET /bricklet/connected: ports lowercase, carrier board last
    // with an empty port. Mirrors the devices measured on the robot.
    const connectedDevices: ConnectedBricklet[] = [
        {
            name: "RGB LED Button Bricklet",
            uid: "2dye",
            port: "a",
            parentUid: "2iLa",
            deviceIdentifier: 282,
        },
        {
            name: "Servo Bricklet 2.0",
            uid: "2h4Z",
            port: "c",
            parentUid: "2iLa",
            deviceIdentifier: 2157,
        },
        {
            name: "Solid State Relay Bricklet 2.0",
            uid: "27FV",
            port: "d",
            parentUid: "2iLa",
            deviceIdentifier: 296,
        },
        {
            name: "HAT Brick",
            uid: "2iLa",
            port: "",
            parentUid: "",
            deviceIdentifier: 111,
        },
    ];

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
            "getConnectedBricklets",
        ]);

        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of([bricklet1, bricklet2, bricklet3]),
        );
        brickletServiceSpy.getConnectedBricklets.and.returnValue(
            of(connectedDevices),
        );

        brickletServiceSpy.getBricklet.and.callFake((number: number) => {
            return [bricklet1, bricklet2, bricklet3].find(
                (b) => b.brickletNumber === number,
            );
        });
        // A successful save subscribes to the returned observable. The spy
        // does not emit a bricklet-cache update, so these tests stay on the
        // call itself.
        brickletServiceSpy.renameBrickletUid.and.returnValue(of(undefined));

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

    describe("connected Bricklets table", () => {
        const cellsOf = (compiled: HTMLElement, name: string): string[] =>
            Array.from(
                compiled.querySelectorAll(
                    `[data-test="TBL_Connected_Bricklets"] [data-test="${name}"]`,
                ),
            ).map((cell) => (cell.textContent ?? "").trim());

        it("loads the connected Bricklets when the tab opens", () => {
            expect(
                brickletServiceSpy.getConnectedBricklets,
            ).toHaveBeenCalledTimes(1);
        });

        it("renders one row per reported device with name, UID and printed port letter, below the UID fields", () => {
            const compiled = fixture.nativeElement as HTMLElement;
            const table = compiled.querySelector(
                '[data-test="TBL_Connected_Bricklets"]',
            ) as HTMLTableElement;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll("tbody tr").length).toBe(4);

            expect(cellsOf(compiled, "TXT_Connected_Bricklet_Name")).toEqual([
                "RGB LED Button Bricklet",
                "Servo Bricklet 2.0",
                "Solid State Relay Bricklet 2.0",
                "HAT Brick",
            ]);
            expect(cellsOf(compiled, "TXT_Connected_Bricklet_UID")).toEqual([
                "2dye",
                "2h4Z",
                "27FV",
                "2iLa",
            ]);
            // The board prints uppercase letters; the backend sends lowercase.
            expect(
                cellsOf(compiled, "TXT_Connected_Bricklet_Port").slice(0, 3),
            ).toEqual(["A", "C", "D"]);

            // The table sits under the form; the form and its fields are intact.
            const form = compiled.querySelector("form") as HTMLElement;
            expect(form).toBeTruthy();
            expect(
                form.querySelectorAll('[data-test^="TXT_Bricklet_UID_"]')
                    .length,
            ).toBe(3);
            expect(form.contains(table)).toBeFalse();
            expect(
                form.compareDocumentPosition(table) &
                    Node.DOCUMENT_POSITION_FOLLOWING,
            ).toBeTruthy();
        });

        it("shows the port tooltip with the letter and the carrier board it sits on", () => {
            const compiled = fixture.nativeElement as HTMLElement;
            const portCells = compiled.querySelectorAll(
                '[data-test="TXT_Connected_Bricklet_Port"]',
            );
            expect(portCells[0].getAttribute("title")).toBe(
                "Port A on HAT Brick 2iLa",
            );
        });

        it("never renders the portless carrier board as an empty cell", () => {
            const compiled = fixture.nativeElement as HTMLElement;
            const carrierRow = compiled.querySelector(
                '[data-test="ROW_Connected_Bricklet_2iLa"]',
            ) as HTMLTableRowElement;
            expect(carrierRow).toBeTruthy();
            const portCell = carrierRow.querySelector(
                '[data-test="TXT_Connected_Bricklet_Port"]',
            ) as HTMLTableCellElement;
            const text = (portCell.textContent ?? "").trim();
            expect(text).not.toBe("");
            expect(text).toContain("—");
            expect(text.toLowerCase()).toContain("carrier board");
            expect(portCell.getAttribute("title")).toContain("Carrier board");

            // No cell anywhere in the table is empty.
            const allCells = Array.from(
                compiled.querySelectorAll(
                    '[data-test="TBL_Connected_Bricklets"] tbody td',
                ),
            );
            expect(allCells.length).toBe(12);
            allCells.forEach((cell) =>
                expect((cell.textContent ?? "").trim()).not.toBe(""),
            );
        });

        it("renders the error message and no table when the read fails", () => {
            brickletServiceSpy.getConnectedBricklets.and.returnValue(
                throwError(() => ({
                    error: {error: "Tinkerforge daemon is not reachable."},
                })),
            );
            const failingFixture = TestBed.createComponent(HardwareIdComponent);
            failingFixture.detectChanges();

            const compiled = failingFixture.nativeElement as HTMLElement;
            const errorBox = compiled.querySelector(
                '[data-test="TXT_Connected_Bricklets_Error"]',
            );
            expect(errorBox).toBeTruthy();
            expect(errorBox?.textContent).toContain(
                "Tinkerforge daemon is not reachable.",
            );
            expect(
                compiled.querySelector('[data-test="TBL_Connected_Bricklets"]'),
            ).toBeNull();
            expect(
                compiled.querySelector(
                    '[data-test="TXT_Connected_Bricklets_Empty"]',
                ),
            ).toBeNull();
            // The failure is confined to the table; the form is still there.
            expect(
                compiled.querySelectorAll('[data-test^="TXT_Bricklet_UID_"]')
                    .length,
            ).toBe(3);
        });

        it("falls back to a generic message when the error carries no text", () => {
            brickletServiceSpy.getConnectedBricklets.and.returnValue(
                throwError(() => new Error("network")),
            );
            const failingFixture = TestBed.createComponent(HardwareIdComponent);
            failingFixture.detectChanges();

            expect(
                failingFixture.componentInstance.connectedBrickletsError,
            ).toBe("Failed to load the connected Bricklets.");
        });

        it("renders an explicit empty row, not a blank table, when nothing is attached", () => {
            brickletServiceSpy.getConnectedBricklets.and.returnValue(of([]));
            const emptyFixture = TestBed.createComponent(HardwareIdComponent);
            emptyFixture.detectChanges();

            const compiled = emptyFixture.nativeElement as HTMLElement;
            expect(
                compiled.querySelector('[data-test="TBL_Connected_Bricklets"]'),
            ).toBeTruthy();
            expect(
                compiled.querySelector(
                    '[data-test="TXT_Connected_Bricklets_Empty"]',
                )?.textContent,
            ).toContain("No Bricklets connected.");
            expect(
                compiled.querySelector(
                    '[data-test="TXT_Connected_Bricklets_Error"]',
                ),
            ).toBeNull();
        });

        it("reads again when the refresh button is clicked and replaces the rows", () => {
            const compiled = fixture.nativeElement as HTMLElement;
            const refreshBtn = compiled.querySelector(
                '[data-test="BTN_Refresh_Connected_Bricklets"]',
            ) as HTMLButtonElement;
            expect(refreshBtn).toBeTruthy();
            expect(
                brickletServiceSpy.getConnectedBricklets,
            ).toHaveBeenCalledTimes(1);

            brickletServiceSpy.getConnectedBricklets.and.returnValue(
                of([connectedDevices[1], connectedDevices[3]]),
            );
            refreshBtn.click();
            fixture.detectChanges();

            expect(
                brickletServiceSpy.getConnectedBricklets,
            ).toHaveBeenCalledTimes(2);
            expect(cellsOf(compiled, "TXT_Connected_Bricklet_UID")).toEqual([
                "2h4Z",
                "2iLa",
            ]);
        });

        it("does not write to the UID form when the table loads or refreshes", () => {
            const before = component.brickletUidForm.getRawValue();
            component.refreshConnectedBricklets();
            fixture.detectChanges();
            expect(component.brickletUidForm.getRawValue()).toEqual(before);
            expect(brickletServiceSpy.renameBrickletUid).not.toHaveBeenCalled();
        });
    });

    it("marks each duplicate UID field and names the other slot", () => {
        component.brickletUidForm.setValue({
            "1": "AAA",
            "2": "AAA",
            "3": "CCC",
        });
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const field = (slot: number) =>
            compiled.querySelector(
                `[data-test="TXT_Bricklet_UID_${slot}"]`,
            ) as HTMLSelectElement;
        const message = (slot: number) =>
            compiled.querySelector(
                `[data-test="MSG_Bricklet_UID_Error_${slot}"]`,
            );

        expect(field(1).tagName).toBe("SELECT");
        expect(field(1).classList).toContain("is-invalid");
        expect(field(2).classList).toContain("is-invalid");
        expect(field(3).classList).not.toContain("is-invalid");
        expect(message(1)?.textContent).toContain("already assigned to slot 2");
        expect(message(2)?.textContent).toContain("already assigned to slot 1");
        expect(message(3)).toBeNull();
        // Red wins over the yellow not-detected warning on the duplicate
        // fields. The unique field can still warn.
        expect(field(1).classList).not.toContain("is-warning");
        expect(field(3).classList).toContain("is-warning");
        expect(
            Array.from(field(1).options).map((option) =>
                (option.textContent ?? "").trim(),
            ),
        ).toContain("AAA - not detected (already assigned to slot 2)");

        const save = compiled.querySelector(
            '[data-test="BTN_Update_bricklet_UIDs"]',
        ) as HTMLButtonElement;
        expect(save.disabled).toBeTrue();
        component.updateIds();
        expect(brickletServiceSpy.renameBrickletUid).not.toHaveBeenCalled();
    });

    it("fills each UID select from detected devices of that type", () => {
        const reported: ConnectedBricklet[] = [
            {
                name: "Servo Bricklet 2.0",
                uid: "2h4Z",
                port: "c",
                parentUid: "2iLa",
                deviceIdentifier: 2157,
            },
            {
                name: "Servo Bricklet 2.0",
                uid: "2aaa",
                port: "a",
                parentUid: "2iLa",
                deviceIdentifier: 2157,
            },
            {
                name: "Solid State Relay Bricklet 2.0",
                uid: "27FV",
                port: "d",
                parentUid: "2iLa",
                deviceIdentifier: 296,
            },
            {
                name: "RGB LED Button Bricklet",
                uid: "2dye",
                port: "a",
                parentUid: "2iLa",
                deviceIdentifier: 282,
            },
            {
                name: "HAT Brick",
                uid: "2iLa",
                port: "",
                parentUid: "",
                deviceIdentifier: 111,
            },
        ];
        brickletServiceSpy.getConnectedBricklets.and.returnValue(of(reported));
        component.refreshConnectedBricklets();
        hardwareContext.next(
            contextFor("pib5edu", [
                controller(
                    1,
                    "tinkerforge_bricklet",
                    "Servo Bricklet",
                    7.5,
                    "2h4Z",
                ),
                controller(
                    5,
                    "tinkerforge_bricklet",
                    "Solid State Relay Bricklet",
                    null,
                    "2iJK",
                ),
                controller(
                    6,
                    "tinkerforge_bricklet",
                    "RGB LED Button Bricklet",
                    null,
                    "2dye",
                ),
            ]),
        );
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const field = (slot: number) =>
            compiled.querySelector(
                `[data-test="TXT_Bricklet_UID_${slot}"]`,
            ) as HTMLSelectElement;
        const labels = (slot: number) =>
            Array.from(field(slot).options).map((option) =>
                (option.textContent ?? "").trim(),
            );

        expect(labels(1)).toEqual([
            "- not configured -",
            "2aaa - Servo Bricklet 2.0 - Port A",
            "2h4Z - Servo Bricklet 2.0 - Port C",
        ]);
        expect(labels(1).join(" ")).not.toContain("HAT");
        expect(labels(1).join(" ")).not.toContain("27FV");
        expect(labels(1).join(" ")).not.toContain("2dye");
        expect(field(1).value).toBe("2h4Z");
        expect(field(1).classList).not.toContain("is-warning");

        expect(labels(5)).toEqual([
            "- not configured -",
            "27FV - Solid State Relay Bricklet 2.0 - Port D",
            "2iJK - not detected",
        ]);
        expect(field(5).value).toBe("2iJK");
        expect(field(5).classList).toContain("is-warning");
        expect(field(5).classList).not.toContain("is-invalid");
        expect(
            compiled.querySelector('[data-test="MSG_Bricklet_UID_Warning_5"]')
                ?.textContent,
        ).toContain("This device is not currently detected.");

        expect(labels(6)).toEqual([
            "- not configured -",
            "2dye - RGB LED Button Bricklet - Port A",
        ]);
        expect(field(6).classList).not.toContain("is-warning");
        expect(field(6).classList).not.toContain("is-invalid");

        const save = compiled.querySelector(
            '[data-test="BTN_Update_bricklet_UIDs"]',
        ) as HTMLButtonElement;
        expect(save.textContent?.trim()).toBe("Save");
        expect(save.id).toBe("update-bricklet-uids-button");
        expect(save.getAttribute("data-test")).toBe("BTN_Update_bricklet_UIDs");
        expect(save.disabled).toBeFalse();
        expect(
            compiled.querySelector(
                '[data-test="BTN_Refresh_Connected_Bricklets"]',
            ),
        ).toBeTruthy();

        const reads = brickletServiceSpy.getConnectedBricklets.calls.count();
        field(1).dispatchEvent(new FocusEvent("focus"));
        expect(brickletServiceSpy.getConnectedBricklets.calls.count()).toBe(
            reads + 1,
        );
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
    // Emits later than ngOnInit, so the rows can only appear if the component
    // notifies change detection itself on the async path.
    let connectedBricklets$: Subject<ConnectedBricklet[]>;

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
            "getConnectedBricklets",
        ]);
        brickletServiceSpy.getBrickletObservable.and.returnValue(
            of([new Bricklet("AAA", 1, "Servo Bricklet")]),
        );
        connectedBricklets$ = new Subject<ConnectedBricklet[]>();
        brickletServiceSpy.getConnectedBricklets.and.returnValue(
            connectedBricklets$.asObservable(),
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

    it("renders the connected Bricklets rows after an asynchronous response without a manual change detection run", async () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(
            compiled.querySelector('[data-test="TBL_Connected_Bricklets"]'),
        ).toBeNull();
        expect(
            compiled.querySelector(
                '[data-test="TXT_Connected_Bricklets_Loading"]',
            ),
        ).toBeTruthy();

        connectedBricklets$.next([
            {
                name: "Servo Bricklet 2.0",
                uid: "2jtj",
                port: "h",
                parentUid: "2iLa",
                deviceIdentifier: 2157,
            },
            {
                name: "HAT Brick",
                uid: "2iLa",
                port: "",
                parentUid: "",
                deviceIdentifier: 111,
            },
        ]);
        await fixture.whenStable();

        const rows = compiled.querySelectorAll(
            '[data-test="TBL_Connected_Bricklets"] tbody tr',
        );
        expect(rows.length).toBe(2);
        expect(rows[0].textContent).toContain("Servo Bricklet 2.0");
        expect(rows[0].textContent).toContain("2jtj");
        expect(rows[0].textContent).toContain("H");
        expect(rows[1].textContent).toContain("HAT Brick");
        expect(rows[1].textContent).toContain("carrier board");
    });

    it("renders the error and no table after an asynchronous failure without a manual change detection run", async () => {
        connectedBricklets$.error({
            error: {error: "Tinkerforge daemon is not reachable."},
        });
        await fixture.whenStable();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(
            compiled.querySelector(
                '[data-test="TXT_Connected_Bricklets_Error"]',
            )?.textContent,
        ).toContain("Tinkerforge daemon is not reachable.");
        expect(
            compiled.querySelector('[data-test="TBL_Connected_Bricklets"]'),
        ).toBeNull();
    });
});

describe("HardwareIdComponent UID save", () => {
    let component: HardwareIdComponent;
    let fixture: ComponentFixture<HardwareIdComponent>;
    let brickletServiceSpy: jasmine.SpyObj<BrickletService>;
    let variantServiceSpy: jasmine.SpyObj<VariantService>;
    let bricklets$: BehaviorSubject<Bricklet[]>;
    let hardwareContext: BehaviorSubject<HardwareContext>;
    // The service cache. renameBrickletUid replaces entries here and then
    // emits, which is what used to rebuild the form from the stale context.
    let cache: Bricklet[];

    beforeEach(async () => {
        cache = [new Bricklet("2iJK", 1, "Servo Bricklet")];
        bricklets$ = new BehaviorSubject<Bricklet[]>(cache.slice());
        hardwareContext = new BehaviorSubject<HardwareContext>(
            contextFor("pib5edu", [
                controller(
                    1,
                    "tinkerforge_bricklet",
                    "Servo Bricklet",
                    7.5,
                    "2iJK",
                ),
            ]),
        );
        brickletServiceSpy = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
            "renameBrickletUid",
            "getBricklet",
            "reloadBrickletsFromDb",
            "getConnectedBricklets",
        ]);
        brickletServiceSpy.getBrickletObservable.and.returnValue(bricklets$);
        brickletServiceSpy.getConnectedBricklets.and.returnValue(of([]));
        brickletServiceSpy.getBricklet.and.callFake((number: number) =>
            cache.find((bricklet) => bricklet.brickletNumber === number),
        );
        brickletServiceSpy.renameBrickletUid.and.callFake(
            (changed: Bricklet[]) => {
                changed.forEach((update) => {
                    const index = cache.findIndex(
                        (bricklet) =>
                            bricklet.brickletNumber === update.brickletNumber,
                    );
                    if (index >= 0) {
                        cache[index] = new Bricklet(
                            update.uid,
                            update.brickletNumber,
                            update.type,
                        );
                    }
                });
                // Context still holds 2iJK. Re-seeding from it would snap
                // the field back and the next save would write 2iJK.
                bricklets$.next(cache.slice());
                return of(undefined);
            },
        );
        variantServiceSpy = jasmine.createSpyObj("VariantService", [
            "getContextObservable",
            "reload",
        ]);
        variantServiceSpy.getContextObservable.and.returnValue(hardwareContext);

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HardwareIdComponent],
            providers: [
                {provide: BrickletService, useValue: brickletServiceSpy},
                {provide: VariantService, useValue: variantServiceSpy},
                {
                    provide: DiagnosticsService,
                    useValue: jasmine.createSpyObj("DiagnosticsService", [
                        "exportHardwareConfig",
                        "importHardwareConfig",
                        "downloadHardwareConfig",
                        "parseHardwareConfigFileContent",
                    ]),
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HardwareIdComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("keeps the saved UID after updateIds and sends no request on a second save", () => {
        const control = component.brickletUidForm.get("1") as AbstractControl;
        expect(component.usingFallback).toBeFalse();
        expect(control.value).toBe("2iJK");

        control.setValue("SF1");
        fixture.detectChanges();
        component.updateIds();
        fixture.detectChanges();

        const select = fixture.nativeElement.querySelector(
            '[data-test="TXT_Bricklet_UID_1"]',
        ) as HTMLSelectElement;
        expect(control.value).toBe("SF1");
        expect(select.value).toBe("SF1");
        expect(select.selectedOptions[0].textContent).toContain("SF1");
        // The variant context was not reloaded by the spy, so it still
        // carries the pre-save address. The field must not follow it.
        expect(hardwareContext.value.controllers[0].address).toBe("2iJK");
        expect(variantServiceSpy.reload).toHaveBeenCalledTimes(1);
        expect(brickletServiceSpy.getConnectedBricklets).toHaveBeenCalledTimes(
            2,
        );

        component.updateIds();

        expect(brickletServiceSpy.renameBrickletUid).toHaveBeenCalledOnceWith(
            jasmine.arrayWithExactContents([
                jasmine.objectContaining({
                    brickletNumber: 1,
                    uid: "SF1",
                    type: "Servo Bricklet",
                }),
            ]),
        );
        expect(variantServiceSpy.reload).toHaveBeenCalledTimes(1);
        expect(control.value).toBe("SF1");
    });
});
