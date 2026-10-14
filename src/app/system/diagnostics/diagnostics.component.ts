import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
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
        private cdr: ChangeDetectorRef,
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

    getStatusBadgeClass(status: string | undefined): string {
        if (status === "ok" || status === "healthy") return "text-bg-success";
        if (status === "warning") return "text-bg-warning";
        return "text-bg-danger";
    }

    getCpuUsagePercent(): number | undefined {
        if (!this.summary) return undefined;
        return (
            this.summary.cpuPercent ??
            this.summary.cpuUsagePercent ??
            this.summary.cpuUsage
        );
    }

    /**
     * The load gets its own rating: `summary.cpuStatus` belongs to the temperature (the backend derives
     * it at 75/85 °C), so reusing it would rate the load by the temperature. The percentages match the
     * threshold the backend uses for memory (80 %).
     */
    getCpuUsagePercentBadgeClass(): string {
        const percent = this.getCpuUsagePercent();
        if (percent === undefined) return "text-bg-secondary";
        if (percent < 80) return "text-bg-success";
        if (percent < 95) return "text-bg-warning";
        return "text-bg-danger";
    }

    get servoBricklets(): BrickletTelemetry[] {
        return this.bricklets.filter((b) => b.type === "Servo Bricklet");
    }

    get buttonBricklets(): BrickletTelemetry[] {
        return this.bricklets.filter(
            (b) => b.type === "RGB LED Button Bricklet",
        );
    }
}
