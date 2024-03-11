import {Component, Input, SimpleChanges} from "@angular/core";
import {Observable, Subscription} from "rxjs";
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

    output: ProgramOutputLine[] = [];
    state: ProgramState = {executionState: ExecutionState.NOT_STARTED};

    outputSubscription?: Subscription;
    stateSubscription?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        if ("output$" in changes) {
            this.outputSubscription?.unsubscribe();
            const outputNext = changes["output$"].currentValue as Observable<
                ProgramOutputLine[]
            >;
            this.outputSubscription = outputNext.subscribe(
                (output) => (this.output = output),
            );
        }
        if ("state$" in changes) {
            this.stateSubscription?.unsubscribe();
            const stateNext = changes["state$"]
                .currentValue as Observable<ProgramState>;
            this.stateSubscription = stateNext.subscribe(
                (state) => (this.state = state),
            );
        }
    }
}
