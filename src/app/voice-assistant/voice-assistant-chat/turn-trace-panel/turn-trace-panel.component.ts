import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    inject,
} from "@angular/core";
import {
    TURN_STAGES,
    TurnTrace,
    ToolCallTrace,
    emptyTurnTrace,
    hasTrace,
    stageRows,
    toolCallRows,
    traceDeltas,
} from "src/app/shared/types/turn-trace";

const LIVE_TICK_MS = 250;

/**
 * The eight stages and the named deltas of the last turn of this chat (PC-83),
 * so a support case can be read without shell access to the container.
 */
@Component({
    selector: "app-turn-trace-panel",
    templateUrl: "./turn-trace-panel.component.html",
    styleUrls: ["./turn-trace-panel.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnTracePanelComponent implements OnChanges, OnDestroy {
    private readonly cdr = inject(ChangeDetectorRef);

    @Input() trace: TurnTrace = emptyTurnTrace();

    private liveTimer: ReturnType<typeof setInterval> | null = null;
    private syncWallMs = 0;
    private syncRelativeMs = 0;

    get rows() {
        return stageRows(this.trace);
    }

    get deltas() {
        return traceDeltas(this.trace);
    }

    get toolRows() {
        return toolCallRows(this.trace);
    }

    get hasData(): boolean {
        return hasTrace(this.trace);
    }

    get hasToolCalls(): boolean {
        return this.trace.toolCalls.length > 0;
    }

    get stageCount(): number {
        return this.rows.filter((row) =>
            (TURN_STAGES as readonly string[]).includes(row.stage),
        ).length;
    }

    get summary(): string {
        if (!this.hasData) {
            return "turn trace: no turn yet";
        }
        const source = this.trace.source || "transport unknown";
        return `turn trace: ${source} · ${this.stageCount}/${TURN_STAGES.length} stages`;
    }

    /**
     * Clock used for the live elapsed time. Injectable so a test can advance it
     * deterministically: fakeAsync patches Date but not performance.now(), so a
     * test that relied on the real clock asserted growth it could not control.
     */
    @Input() now: () => number = () => performance.now();

    ngOnChanges(): void {
        this.syncWallMs = this.now();
        this.syncRelativeMs = this.latestRelativeMs(this.trace);
        this.syncLiveTimer();
    }

    ngOnDestroy(): void {
        this.clearLiveTimer();
    }

    toolDurationMs(call: {
        status: ToolCallTrace["status"];
        startedMs: number;
        durationMs: number | null;
    }): number {
        if (call.status !== "running") {
            return call.durationMs ?? 0;
        }
        const nowRelative =
            this.syncRelativeMs + (this.now() - this.syncWallMs);
        return Math.round(Math.max(0, nowRelative - call.startedMs) * 10) / 10;
    }

    statusLabel(status: ToolCallTrace["status"]): string {
        return status;
    }

    private latestRelativeMs(trace: TurnTrace): number {
        let max = 0;
        for (const row of stageRows(trace)) {
            max = Math.max(max, row.ms);
        }
        for (const call of trace.toolCalls) {
            max = Math.max(max, call.startedMs);
            if (call.durationMs != null) {
                max = Math.max(max, call.startedMs + call.durationMs);
            }
        }
        return max;
    }

    private hasRunningToolCalls(): boolean {
        return this.trace.toolCalls.some((call) => call.status === "running");
    }

    private syncLiveTimer(): void {
        if (this.hasRunningToolCalls()) {
            if (!this.liveTimer) {
                this.liveTimer = setInterval(() => {
                    this.cdr.markForCheck();
                }, LIVE_TICK_MS);
            }
        } else {
            this.clearLiveTimer();
        }
    }

    private clearLiveTimer(): void {
        if (this.liveTimer) {
            clearInterval(this.liveTimer);
            this.liveTimer = null;
        }
    }
}
