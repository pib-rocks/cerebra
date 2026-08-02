import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  DiagnosticsService,
  DiagnosticsSummary,
  BrickletTelemetry,
  SystemTelemetry,
  HardwareConfig,
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
  @ViewChild("hardwareImportInput")
  hardwareImportInput?: ElementRef<HTMLInputElement>;

  summary: DiagnosticsSummary | null = null;
  bricklets: BrickletTelemetry[] = [];
  system: SystemTelemetry | null = null;
  loading = false;
  error: string | null = null;

  exportingHardwareIds = false;
  importingHardwareIds = false;
  showImportModal = false;
  importPreview: HardwareConfig | null = null;
  importErrors: string[] = [];
  importWarnings: string[] = [];
  importSuccessMessage: string | null = null;

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
      error: () => {
        this.error = "Failed to load system diagnostics summary.";
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

  exportHardwareIds(): void {
    this.exportingHardwareIds = true;
    this.error = null;
    this.importSuccessMessage = null;
    this.cdr.markForCheck();

    this.diagnosticsService.exportHardwareConfig().subscribe({
      next: (config) => {
        this.diagnosticsService.downloadHardwareConfig(config);
        this.exportingHardwareIds = false;
        this.importSuccessMessage = "Hardware-IDs exported successfully.";
        this.cdr.markForCheck();
      },
      error: () => {
        this.exportingHardwareIds = false;
        this.error = "Failed to export Hardware-IDs.";
        this.cdr.markForCheck();
      },
    });
  }

  openImportModal(): void {
    this.resetImportState();
    this.showImportModal = true;
    this.cdr.markForCheck();
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.resetImportState();
    this.cdr.markForCheck();
  }

  openHardwareImportFileDialog(): void {
    this.hardwareImportInput?.nativeElement.click();
  }

  onHardwareImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";

    this.importPreview = null;
    this.importErrors = [];
    this.importWarnings = [];
    this.importSuccessMessage = null;
    this.cdr.markForCheck();

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const result =
        this.diagnosticsService.parseHardwareConfigFileContent(content);
      this.importErrors = result.errors;
      this.importWarnings = result.warnings;
      this.importPreview = result.valid ? result.config ?? null : null;
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.importErrors = ["The selected file could not be read."];
      this.importPreview = null;
      this.cdr.markForCheck();
    };
    reader.readAsText(file);
  }

  confirmHardwareImport(): void {
    if (!this.importPreview || this.importingHardwareIds) {
      return;
    }

    this.importingHardwareIds = true;
    this.error = null;
    this.cdr.markForCheck();

    this.diagnosticsService.importHardwareConfig(this.importPreview).subscribe({
      next: () => {
        this.importingHardwareIds = false;
        this.showImportModal = false;
        this.resetImportState();
        this.importSuccessMessage = "Hardware-IDs imported successfully.";
        this.refreshDiagnostics();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.importingHardwareIds = false;
        const serverError =
          err?.error?.error || "Failed to import Hardware-IDs.";
        this.importErrors = [serverError];
        this.cdr.markForCheck();
      },
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (status === "ok" || status === "healthy") return "badge-success";
    if (status === "warning") return "badge-warning";
    return "badge-danger";
  }

  getCpuUsagePercent(): number | undefined {
    if (!this.summary) return undefined;
    return (
      this.summary.cpuPercent ??
      this.summary.cpuUsagePercent ??
      this.summary.cpuUsage
    );
  }

  get servoBricklets(): BrickletTelemetry[] {
    return this.bricklets.filter((b) => b.type === "Servo Bricklet");
  }

  get buttonBricklets(): BrickletTelemetry[] {
    return this.bricklets.filter((b) => b.type === "RGB LED Button Bricklet");
  }

  private resetImportState(): void {
    this.importPreview = null;
    this.importErrors = [];
    this.importWarnings = [];
    this.importingHardwareIds = false;
  }
}
