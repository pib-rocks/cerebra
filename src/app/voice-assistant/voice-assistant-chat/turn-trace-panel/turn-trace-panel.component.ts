import {ChangeDetectionStrategy, Component, Input} from "@angular/core";
import {
    TURN_STAGES,
    TurnTrace,
    emptyTurnTrace,
    hasTrace,
    stageRows,
    traceDeltas,
} from "src/app/shared/types/turn-trace";

/**
 * The eight stages and the named deltas of the last turn of this chat (PC-83),
 * so a support case can be read without shell access to the container.
 */
@Component({
    selector: "app-turn-trace-panel",
    templateUrl: "./turn-trace-panel.component.html",
    styleUrls: ["./turn-trace-panel.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TurnTracePanelComponent {
    @Input() trace: TurnTrace = emptyTurnTrace();

    get rows() {
        return stageRows(this.trace);
    }

    get deltas() {
        return traceDeltas(this.trace);
    }

    get hasData(): boolean {
        return hasTrace(this.trace);
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
}
