import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DiagnosticsComponent } from "./diagnostics.component";
import { DiagnosticsService } from "./diagnostics.service";
import { of } from "rxjs";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

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
        diskSpace: { total: "64.0 GB", used: "20.0 GB", free: "44.0 GB", percentUsed: 31.2 },
        diskStatus: "ok",
        containersStatus: "ok",
        brickletsStatus: "ok",
        healthyContainersCount: 6,
        totalContainersCount: 6,
        totalBrickletsCount: 7,
      })
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
            pins: [{ pin: 0, voltage: 5.0, current: 20.0 }],
          },
        ],
      })
    );

    diagnosticsServiceSpy.getSystem.and.returnValue(
      of({
        cpuTemperature: 50.0,
        diskSpace: { total: "64.0 GB", used: "20.0 GB", free: "44.0 GB", percentUsed: 31.2 },
        containers: [{ name: "pib-backend", status: "running", health: "healthy" }],
        status: "ok",
      })
    );

    await TestBed.configureTestingModule({
      imports: [DiagnosticsComponent],
      providers: [
        { provide: DiagnosticsService, useValue: diagnosticsServiceSpy },
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
      compiled.querySelectorAll("#table-system-summary thead th")
    ).map((th) => th.textContent?.trim());

    expect(headers).toContain("Free RAM");
    expect(headers).toContain("Free disk space");
    expect(headers).not.toContain("RAM Memory");
    expect(headers).not.toContain("Disk Space");
  });

  it("should format disk space as free / total (percentUsed%)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cells = compiled.querySelectorAll("#table-system-summary tbody td");
    const diskCell = cells[3];

    expect(diskCell?.textContent?.replace(/\s+/g, " ").trim()).toContain(
      "44.0 GB / 64.0 GB (31.2%)"
    );
  });

  it("should display CPU usage percentage inside the Free RAM cell", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cells = compiled.querySelectorAll("#table-system-summary tbody td");
    const ramCell = cells[2];

    expect(ramCell?.textContent).toContain("CPU: 42.5%");
    expect(component.getCpuUsagePercent()).toBe(42.5);
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

  it("should remove ID column from servo and button bricklet tables and use colspan 4 for empty rows", () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const servoHeaders = Array.from(
      compiled.querySelectorAll("#table-servo-bricklets thead th")
    ).map((th) => th.textContent?.trim());
    const buttonHeaders = Array.from(
      compiled.querySelectorAll("#table-button-bricklets thead th")
    ).map((th) => th.textContent?.trim());

    expect(servoHeaders).not.toContain("ID");
    expect(buttonHeaders).not.toContain("ID");
    expect(servoHeaders).toEqual(["UID", "Status", "Voltage", "Current"]);
    expect(buttonHeaders).toEqual(["UID", "Status", "Color", "Press State"]);

    const servoCells = compiled.querySelectorAll("#table-servo-bricklets tbody tr td");
    expect(servoCells.length).toBe(4);
    expect(servoCells[0].textContent?.trim()).toBe("29FA");

    // Re-create with no bricklets so both empty-state rows render under OnPush
    diagnosticsServiceSpy.getBricklets.and.returnValue(of({ bricklets: [] }));
    const emptyFixture = TestBed.createComponent(DiagnosticsComponent);
    emptyFixture.detectChanges();
    const emptyCompiled = emptyFixture.nativeElement as HTMLElement;

    const servoEmpty = emptyCompiled.querySelector(
      "#table-servo-bricklets tbody tr td"
    ) as HTMLTableCellElement;
    const buttonEmpty = emptyCompiled.querySelector(
      "#table-button-bricklets tbody tr td"
    ) as HTMLTableCellElement;

    expect(servoEmpty.textContent).toContain("No Servo Bricklet telemetry data available.");
    expect(buttonEmpty.textContent).toContain("No RGB LED Button telemetry data available.");
    expect(servoEmpty.colSpan).toBe(4);
    expect(buttonEmpty.colSpan).toBe(4);
  });

  it("should not render Export or Import Hardware-IDs buttons", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-test="BTN_Export_Hardware_IDs"]')).toBeNull();
    expect(compiled.querySelector('[data-test="BTN_Import_Hardware_IDs"]')).toBeNull();
    expect(compiled.querySelector("#hardware-ids-import-modal")).toBeNull();
  });
});
