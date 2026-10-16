import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Subscription, interval} from "rxjs";
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
export class DiagnosticsComponent implements OnInit, OnDestroy {
    /**
     * The page refreshes itself; the manual refresh button was removed. The interval is what keeps the
     * telemetry current, so it must survive the whole life of the component and stop with it.
     */
    readonly refreshIntervalMs = 1000;

    summary: DiagnosticsSummary | null = null;
    bricklets: BrickletTelemetry[] = [];
    system: SystemTelemetry | null = null;
    error: string | null = null;

    private refreshSubscription?: Subscription;
    private refreshInFlight = false;

    constructor(
        private diagnosticsService: DiagnosticsService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.refreshDiagnostics();
        this.refreshSubscription = interval(this.refreshIntervalMs).subscribe(
            () => this.refreshDiagnostics(),
        );
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    refreshDiagnostics(): void {
        // The board answers slowly enough that a tick can arrive while the previous round is still open.
        // Skipping it keeps one round in flight instead of stacking three requests every second.
        if (this.refreshInFlight) return;
        this.refreshInFlight = true;
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
                this.refreshInFlight = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.refreshInFlight = false;
                this.cdr.markForCheck();
            },
            // A response without a body would otherwise leave the guard held and stop every later round.
            complete: () => {
                this.refreshInFlight = false;
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
