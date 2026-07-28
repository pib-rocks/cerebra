import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  DiagnosticsService,
  DiagnosticsSummary,
  BrickletTelemetry,
  SystemTelemetry,
} from "./diagnostics.service";

@Component({
  selector: "app-diagnostics",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./diagnostics.component.html",
  styleUrls: ["./diagnostics.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsComponent implements OnInit {
  summary: DiagnosticsSummary | null = null;
  bricklets: BrickletTelemetry[] = [];
  system: SystemTelemetry | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private diagnosticsService: DiagnosticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshDiagnostics();
  }

  refreshDiagnostics(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.diagnosticsService.getSummary().subscribe({
      next: (sum) => {
        this.summary = sum;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = "Fehler beim Laden der Systemübersicht";
        this.cdr.markForCheck();
      },
    });

    this.diagnosticsService.getBricklets().subscribe({
      next: (res) => {
        this.bricklets = res.bricklets || [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.diagnosticsService.getSystem().subscribe({
      next: (sys) => {
        this.system = sys;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (status === "ok" || status === "healthy") return "badge-success";
    if (status === "warning") return "badge-warning";
    return "badge-danger";
  }
}
