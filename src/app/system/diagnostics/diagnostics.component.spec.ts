import {
    ComponentFixture,
    TestBed,
    discardPeriodicTasks,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import {DiagnosticsComponent} from "./diagnostics.component";
import {DiagnosticsService, SystemTelemetry} from "./diagnostics.service";
import {Subject, of} from "rxjs";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";

describe("DiagnosticsComponent", () => {
    let component: DiagnosticsComponent;
    let fixture: ComponentFixture<DiagnosticsComponent>;
    let diagnosticsServiceSpy: jasmine.SpyObj<DiagnosticsService>;

    beforeEach(async () => {
        diagnosticsServiceSpy = jasmine.createSpyObj("DiagnosticsService", [
            "getSummary",
            "getBricklets",
            "getSystem",
        ]);

        diagnosticsServiceSpy.getSummary.and.returnValue(
            of({
                overallStatus: "ok",
                cpuTemperature: 50.0,
                cpuStatus: "ok",
                cpuPercent: 42.5,
                memoryUsage: {
                    total: "8.0 GB",
                    used: "3.2 GB",
                    free: "4.8 GB",
                    percentUsed: 40.0,
                },
                memoryStatus: "ok",
                diskSpace: {
                    total: "64.0 GB",
                    used: "20.0 GB",
                    free: "44.0 GB",
                    percentUsed: 31.2,
                },
                diskStatus: "ok",
                containersStatus: "ok",
                brickletsStatus: "ok",
                healthyContainersCount: 6,
                totalContainersCount: 6,
                totalBrickletsCount: 7,
            }),
        );

        diagnosticsServiceSpy.getBricklets.and.returnValue(
            of({
                bricklets: [
                    {
                        brickletNumber: 1,
                        uid: "29FA",
                        type: "Servo Bricklet",
                        voltage: 5.0,
                        current: 120.0,
                        status: "ok",
                        pins: [{pin: 0, voltage: 5.0, current: 20.0}],
                    },
                ],
            }),
        );

        diagnosticsServiceSpy.getSystem.and.returnValue(
            of({
                cpuTemperature: 50.0,
                diskSpace: {
                    total: "64.0 GB",
                    used: "20.0 GB",
                    free: "44.0 GB",
                    percentUsed: 31.2,
                },
                containers: [
                    {name: "pib-backend", status: "running", health: "healthy"},
                ],
                status: "ok",
            }),
        );

        await TestBed.configureTestingModule({
            imports: [DiagnosticsComponent],
            providers: [
                {provide: DiagnosticsService, useValue: diagnosticsServiceSpy},
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DiagnosticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create component and load telemetry on init", () => {
        expect(component).toBeTruthy();
        expect(diagnosticsServiceSpy.getSummary).toHaveBeenCalled();
        expect(diagnosticsServiceSpy.getBricklets).toHaveBeenCalled();
        expect(diagnosticsServiceSpy.getSystem).toHaveBeenCalled();
        expect(component.summary?.overallStatus).toBe("ok");
        expect(component.bricklets.length).toBe(1);
    });

    it("should render Servo Bricklets and RGB LED Buttons tables side-by-side in col-md-6 grid columns", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const servoTable = compiled.querySelector("#table-servo-bricklets");
        const buttonTable = compiled.querySelector("#table-button-bricklets");

        expect(servoTable).toBeTruthy();
        expect(buttonTable).toBeTruthy();

        const servoCol = servoTable?.closest(".col-md-6");
        const buttonCol = buttonTable?.closest(".col-md-6");

        expect(servoCol).toBeTruthy();
        expect(buttonCol).toBeTruthy();
        expect(servoCol?.parentElement).toBe(buttonCol?.parentElement);
    });

    it("should apply native dark mode styling (table-dark) and mb-0 to all diagnostics tables", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const summaryTable = compiled.querySelector("#table-system-summary");
        const servoTable = compiled.querySelector("#table-servo-bricklets");
        const buttonTable = compiled.querySelector("#table-button-bricklets");

        expect(summaryTable?.classList.contains("table-dark")).toBeTrue();
        expect(summaryTable?.classList.contains("mb-0")).toBeTrue();

        expect(servoTable?.classList.contains("table-dark")).toBeTrue();
        expect(servoTable?.classList.contains("mb-0")).toBeTrue();

        expect(buttonTable?.classList.contains("table-dark")).toBeTrue();
        expect(buttonTable?.classList.contains("mb-0")).toBeTrue();
    });

    it("should rename summary headers to Free RAM and Free disk space", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const headers = Array.from(
            compiled.querySelectorAll("#table-system-summary thead th"),
        ).map((th) => th.textContent?.trim());

        expect(headers).toContain("Free RAM");
        expect(headers).toContain("Free disk space");
        expect(headers).not.toContain("RAM Memory");
        expect(headers).not.toContain("Disk Space");
    });

    it("should format disk space as free / total (percentUsed%)", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const cells = compiled.querySelectorAll(
            "#table-system-summary tbody td",
        );
        const diskCell = cells[3];

        expect(diskCell?.textContent?.replace(/\s+/g, " ").trim()).toContain(
            "44.0 GB / 64.0 GB (31.2%)",
        );
    });

    it("should show the CPU load in the first column instead of the overall status", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const headers = Array.from(
            compiled.querySelectorAll("#table-system-summary thead th"),
        ).map((th) => th.textContent?.trim());
        expect(headers[0]).toBe("CPU load");
        expect(headers).not.toContain("Overall Status");

        const cells = compiled.querySelectorAll(
            "#table-system-summary tbody td",
        );
        expect(cells[0]?.textContent?.replace(/\s+/g, " ").trim()).toContain(
            "42.5%",
        );
        // The load no longer hides under Free RAM.
        expect(cells[2]?.textContent).not.toContain("CPU");
        expect(component.getCpuUsagePercent()).toBe(42.5);
    });

    it("should rate the CPU load by its own thresholds", () => {
        // cpuPercent has priority over cpuUsagePercent, so it has to be cleared for this.
        component.summary = {
            ...component.summary!,
            cpuPercent: undefined,
            cpuUsagePercent: 40,
        };
        expect(component.getCpuUsagePercentBadgeClass()).toBe(
            "text-bg-success",
        );

        component.summary = {...component.summary!, cpuUsagePercent: 85};
        expect(component.getCpuUsagePercentBadgeClass()).toBe(
            "text-bg-warning",
        );

        component.summary = {...component.summary!, cpuUsagePercent: 99};
        expect(component.getCpuUsagePercentBadgeClass()).toBe("text-bg-danger");
    });

    it("should resolve CPU usage from cpuUsagePercent or cpuUsage fallbacks", () => {
        component.summary = {
            ...component.summary!,
            cpuPercent: undefined,
            cpuUsagePercent: 18,
            cpuUsage: undefined,
        };
        expect(component.getCpuUsagePercent()).toBe(18);

        component.summary = {
            ...component.summary!,
            cpuPercent: undefined,
            cpuUsagePercent: undefined,
            cpuUsage: 7,
        };
        expect(component.getCpuUsagePercent()).toBe(7);
    });

    it("should render Waveshare serial motor controllers in the servo table with dynamic heading", () => {
        const feetechBricklets = [1, 2, 3, 4].map((n) => ({
            brickletNumber: n,
            uid: `WS${n}`,
            type: "Motor Controller",
            kind: "feetech_st_serial" as const,
            voltage: 12.0 + n * 0.1,
            current: 100.0 + n,
            status: "ok",
            pins: [],
        }));
        diagnosticsServiceSpy.getBricklets.and.returnValue(
            of({bricklets: feetechBricklets}),
        );
        const feetechFixture = TestBed.createComponent(DiagnosticsComponent);
        feetechFixture.detectChanges();
        const compiled = feetechFixture.nativeElement as HTMLElement;

        const heading = compiled
            .querySelector("#table-servo-bricklets")
            ?.closest(".card")
            ?.querySelector(".card-title");
        expect(heading?.textContent?.trim()).toBe(
            "Waveshare Serial Controllers",
        );

        const rows = compiled.querySelectorAll(
            "#table-servo-bricklets tbody tr",
        );
        expect(rows.length).toBe(4);
        feetechBricklets.forEach((b, i) => {
            const cells = rows[i].querySelectorAll("td");
            expect(cells[0].textContent?.trim()).toBe(b.uid);
            expect(cells[2].textContent?.replace(/\s+/g, " ").trim()).toBe(
                `${b.voltage.toFixed(1)} V`,
            );
            expect(cells[3].textContent?.replace(/\s+/g, " ").trim()).toBe(
                `${b.current.toFixed(1)} mA`,
            );
        });

        diagnosticsServiceSpy.getBricklets.and.returnValue(
            of({
                bricklets: [
                    {
                        brickletNumber: 1,
                        uid: "29FA",
                        type: "Servo Bricklet",
                        voltage: 5.0,
                        current: 120.0,
                        status: "ok",
                        pins: [{pin: 0, voltage: 5.0, current: 20.0}],
                    },
                ],
            }),
        );
        const servoFixture = TestBed.createComponent(DiagnosticsComponent);
        servoFixture.detectChanges();
        const servoHeading = (servoFixture.nativeElement as HTMLElement)
            .querySelector("#table-servo-bricklets")
            ?.closest(".card")
            ?.querySelector(".card-title");
        expect(servoHeading?.textContent?.trim()).toBe("Servo Bricklets");
    });

    it("should remove ID column from servo and button bricklet tables and use colspan 4 for empty rows", () => {
        const compiled = fixture.nativeElement as HTMLElement;

        const servoHeaders = Array.from(
            compiled.querySelectorAll("#table-servo-bricklets thead th"),
        ).map((th) => th.textContent?.trim());
        const buttonHeaders = Array.from(
            compiled.querySelectorAll("#table-button-bricklets thead th"),
        ).map((th) => th.textContent?.trim());

        expect(servoHeaders).not.toContain("ID");
        expect(buttonHeaders).not.toContain("ID");
        expect(servoHeaders).toEqual(["UID", "Status", "Voltage", "Current"]);
        expect(buttonHeaders).toEqual([
            "UID",
            "Status",
            "Color",
            "Press State",
        ]);

        const servoCells = compiled.querySelectorAll(
            "#table-servo-bricklets tbody tr td",
        );
        expect(servoCells.length).toBe(4);
        expect(servoCells[0].textContent?.trim()).toBe("29FA");

        // Re-create with no bricklets so both empty-state rows render under OnPush
        diagnosticsServiceSpy.getBricklets.and.returnValue(of({bricklets: []}));
        const emptyFixture = TestBed.createComponent(DiagnosticsComponent);
        emptyFixture.detectChanges();
        const emptyCompiled = emptyFixture.nativeElement as HTMLElement;

        const servoEmpty = emptyCompiled.querySelector(
            "#table-servo-bricklets tbody tr td",
        ) as HTMLTableCellElement;
        const buttonEmpty = emptyCompiled.querySelector(
            "#table-button-bricklets tbody tr td",
        ) as HTMLTableCellElement;

        expect(servoEmpty.textContent).toContain(
            "No Servo Bricklet telemetry data available.",
        );
        expect(buttonEmpty.textContent).toContain(
            "No RGB LED Button telemetry data available.",
        );
        expect(servoEmpty.colSpan).toBe(4);
        expect(buttonEmpty.colSpan).toBe(4);
    });

    it("should always show the telemetry numbers with one decimal place", () => {
        // The four columns are read along a row, so "60%" next to "42.5%" must not read like a second
        // measurement precision. Whole numbers therefore get a ".0", and the ready-made RAM/disk strings are
        // normalised inside as well.
        //
        // The fixture is rebuilt with the new payload: the component is OnPush, so mutating `summary` after the
        // first detection would not repaint the template.
        diagnosticsServiceSpy.getSummary.and.returnValue(
            of({
                ...component.summary!,
                cpuPercent: 60,
                cpuTemperature: 50,
                memoryUsage: {
                    total: "8 GB",
                    used: "3 GB",
                    free: "5 GB",
                    percentUsed: 47,
                },
                diskSpace: {
                    total: "64 GB",
                    used: "44 GB",
                    free: "20 GB",
                    percentUsed: 31,
                },
            }),
        );
        fixture = TestBed.createComponent(DiagnosticsComponent);
        fixture.detectChanges();

        const cells = Array.from(
            fixture.nativeElement.querySelectorAll(
                "#table-system-summary tbody td",
            ) as NodeListOf<HTMLElement>,
        ).map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim());

        expect(cells[0]).toContain("60.0%");
        expect(cells[1]).toContain("50.0 °C");
        expect(cells[2]).toContain("3.0 GB / 8.0 GB (47.0%)");
        // The disk column shows free / total, so the normalised "free" figure is the one to look for.
        expect(cells[3]).toContain("20.0 GB / 64.0 GB (31.0%)");
    });

    it("should round a measurement to one decimal place", () => {
        expect(component.formatOneDecimal(60)).toBe("60.0");
        expect(component.formatOneDecimal(42.5)).toBe("42.5");
        // toFixed rounds the binary value, and 60.55 is not exactly representable - 60.56 is.
        expect(component.formatOneDecimal(60.56)).toBe("60.6");
        expect(component.formatOneDecimal(0)).toBe("0.0");
        expect(component.formatOneDecimal(undefined)).toBe("");
        expect(component.formatOneDecimal(null)).toBe("");
    });

    it("should normalise the number inside a ready-made measurement string", () => {
        expect(component.formatMeasure("3 GB")).toBe("3.0 GB");
        expect(component.formatMeasure("3.7 GB")).toBe("3.7 GB");
        expect(component.formatMeasure("1000 MB")).toBe("1000.0 MB");
        expect(component.formatMeasure("")).toBe("");
        expect(component.formatMeasure(undefined)).toBe("");
    });

    it("should not render Export or Import Hardware-IDs buttons", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(
            compiled.querySelector('[data-test="BTN_Export_Hardware_IDs"]'),
        ).toBeNull();
        expect(
            compiled.querySelector('[data-test="BTN_Import_Hardware_IDs"]'),
        ).toBeNull();
        expect(compiled.querySelector("#hardware-ids-import-modal")).toBeNull();
    });

    it("should not render the manual refresh button any more", () => {
        // The page keeps itself current; a manual trigger would be a second, competing mechanism.
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector("#btn-refresh-diagnostics")).toBeNull();
        expect(
            compiled.querySelector('[data-test="BTN_Refresh_Diagnostics"]'),
        ).toBeNull();
        expect(compiled.querySelector(".fa-sync-alt")).toBeNull();
    });

    /**
     * The auto refresh lives in a timer, so these tests build their own fixture: the one from the shared
     * `beforeEach` gets its interval in the root zone, where `tick()` cannot reach it. The spy counters are
     * reset afterwards, because the `beforeEach` fixture already spent one round.
     */
    function freshFixture(): void {
        fixture.destroy();
        fixture = TestBed.createComponent(DiagnosticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        diagnosticsServiceSpy.getSummary.calls.reset();
        diagnosticsServiceSpy.getBricklets.calls.reset();
        diagnosticsServiceSpy.getSystem.calls.reset();
    }

    it("should refresh the telemetry once per second on its own", fakeAsync(() => {
        freshFixture();
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(0);

        tick(999);
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(0);
        tick(1);
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(1);
        tick(2000);
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(3);
        expect(diagnosticsServiceSpy.getSummary.calls.count()).toBe(3);

        fixture.destroy();
        discardPeriodicTasks();
    }));

    it("should stop refreshing once the component is destroyed", fakeAsync(() => {
        freshFixture();
        tick(1000);
        const before = diagnosticsServiceSpy.getSystem.calls.count();
        expect(before).toBe(1);

        fixture.destroy();
        tick(5000); // five more rounds if the subscription survived the destroy
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(before);
        discardPeriodicTasks();
    }));

    it("should skip a tick while the previous round is still open", fakeAsync(() => {
        fixture.destroy();
        const pending = new Subject<SystemTelemetry>();
        diagnosticsServiceSpy.getSystem.and.returnValue(pending.asObservable());
        fixture = TestBed.createComponent(DiagnosticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        diagnosticsServiceSpy.getSystem.calls.reset();

        tick(3000); // the first round never answered, so nothing may be stacked on top of it
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(0);

        pending.complete(); // an answer without a body must release the guard too
        tick(1000);
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(1);
        tick(1000);
        expect(diagnosticsServiceSpy.getSystem.calls.count()).toBe(2);

        fixture.destroy();
        discardPeriodicTasks();
    }));
});
