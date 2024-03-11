import {Component, Input, SimpleChanges} from "@angular/core";
import {Observable} from "rxjs";
import {ProgramOutputLine} from "src/app/shared/ros-types/msg/program-output-line";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

@Component({
    selector: "app-console",
    templateUrl: "./console.component.html",
    styleUrls: ["./console.component.css"],
})
export class ConsoleComponent {
    @Input() output$!: Observable<ProgramOutputLine[]>;
    @Input() state$!: Observable<ProgramState>;

    ExecutionState = ExecutionState;

    ngOnChanges(changes: SimpleChanges): void {
        if ("output$" in changes) {
            (
                changes["output$"].currentValue as Observable<
                    ProgramOutputLine[]
                >
            ).subscribe((output) => (this.output = output));
        }
        if ("state$" in changes) {
            (
                changes["state$"].currentValue as Observable<ProgramState>
            ).subscribe((state) => (this.state = state));
        }
    }

    output: ProgramOutputLine[] = [];
    state: ProgramState = {executionState: ExecutionState.NOT_STARTED};
}
