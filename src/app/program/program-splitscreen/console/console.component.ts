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
    @Input() programOutput$!: Observable<ProgramLogLine[]>;
    @Input() programState$!: Observable<ProgramState>;
    @Output() programInput = new EventEmitter<string>();

    programInputForm: FormControl<string> = new FormControl();

    @ViewChild("programInputArea") programInputArea!: ElementRef;

    ExecutionState = ExecutionState;

    lines: ProgramLogLine[] = [];
    lastLineIfInput: ProgramLogLine | undefined = undefined;

    state: ProgramState = {executionState: ExecutionState.NOT_STARTED};

    outputSubscription?: Subscription;
    stateSubscription?: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        this.programInputForm.valueChanges.subscribe(
            this.onInputValueChanged.bind(this),
        );

        if ("programOutput$" in changes) {
            this.outputSubscription?.unsubscribe();
            const outputNext = changes["programOutput$"]
                .currentValue as Observable<ProgramLogLine[]>;
            this.outputSubscription = outputNext.subscribe(
                this.onOutputReceived.bind(this),
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

    private get lastLineIfInputContent(): string {
        return this.lastLineIfInput?.content ?? "";
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
        if (!input.startsWith(this.lastLineIfInputContent)) {
            this.programInputForm.setValue(this.lastLineIfInputContent);
        } else {
            input = input.substring(this.lastLineIfInputContent.length);
            if (input.endsWith("\n")) {
                input = input.substring(0, input.length - 1);
                this.programInput.emit(input);
            }
        }
    }

    private onOutputReceived(lines: ProgramLogLine[]) {
        this.lines = [...lines];
        this.lastLineIfInput = this.lines.pop();
        if (this.lastLineIfInput?.hasInput) {
            this.lines.push(this.lastLineIfInput);
            this.lastLineIfInput = undefined;
        }
        this.lines.reverse();
        this.programInputForm.setValue(this.lastLineIfInputContent);
        this.programInputAreaElement?.focus();
    }

    private onStateUpdated(state: ProgramState) {
        this.state = state;
    }
}
