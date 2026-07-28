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
});
