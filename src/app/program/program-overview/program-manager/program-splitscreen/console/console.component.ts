import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild,
} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable, Subscription} from "rxjs";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

@Component({
    selector: "app-console",
    templateUrl: "./console.component.html",
    styleUrls: ["./console.component.scss"],
})
export class ConsoleComponent implements AfterViewInit, OnChanges {
    @Input() programLogs$!: Observable<ProgramLogLine[]>;
    @Input() programState$!: Observable<ProgramState>;
    @Output() programInput = new EventEmitter<string>();

    programInputForm: FormControl<string> = new FormControl();

    @ViewChild("programInputArea") programInputArea!: ElementRef;

    ExecutionState = ExecutionState;

    logs: ProgramLogLine[] = [];
    lastLogLineIfInput: ProgramLogLine | undefined = undefined;

    state: ProgramState = {executionState: ExecutionState.NOT_STARTED};

    logsSubscription?: Subscription;
    stateSubscription?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        this.programInputForm.valueChanges.subscribe(
            this.onInputValueChanged.bind(this),
        );

        if ("programLogs$" in changes) {
            this.logsSubscription?.unsubscribe();
            const logsNext = changes["programLogs$"].currentValue as Observable<
                ProgramLogLine[]
            >;
            this.logsSubscription = logsNext.subscribe(
                this.onLogsReceived.bind(this),
            );
        }

        if ("programState$" in changes) {
            this.stateSubscription?.unsubscribe();
            const stateNext = changes["programState$"]
                .currentValue as Observable<ProgramState>;
            this.stateSubscription = stateNext.subscribe(
                this.onStateUpdated.bind(this),
            );
        }
    }

    ngAfterViewInit() {
        this.programInputForm.setValue("");
        this.programInputAreaElement?.focus();
    }

    onClick() {
        this.programInputAreaElement?.focus();
    }

    private get programInputAreaElement(): HTMLElement | undefined {
        return this.programInputArea?.nativeElement as HTMLElement;
    }

    private get lastLogLineIfInputContent(): string {
        return this.lastLogLineIfInput?.content ?? "";
    }

    private resizeProgramInputArea() {
        const element = this.programInputAreaElement;
        if (element?.style) {
            element.style.height = "auto";
            element.style.height = `${element.scrollHeight}px`;
        }
    }

    private onInputValueChanged() {
        this.resizeProgramInputArea();
        let input = this.programInputForm.value ?? "";
        if (!input.startsWith(this.lastLogLineIfInputContent)) {
            this.programInputForm.setValue(this.lastLogLineIfInputContent);
        } else {
            input = input.substring(this.lastLogLineIfInputContent.length);
            if (input.endsWith("\n")) {
                input = input.substring(0, input.length - 1);
                this.programInput.emit(input);
            }
        }
    }

    private onLogsReceived(logs: ProgramLogLine[]) {
        this.logs = [...logs];
        this.lastLogLineIfInput = this.logs.pop();
        if (this.lastLogLineIfInput?.hasInput) {
            this.logs.push(this.lastLogLineIfInput);
            this.lastLogLineIfInput = undefined;
        }
        this.logs.reverse();
        this.programInputForm.setValue(this.lastLogLineIfInputContent);
        this.programInputAreaElement?.focus();
    }

    private onStateUpdated(state: ProgramState) {
        this.state = state;
    }
}
