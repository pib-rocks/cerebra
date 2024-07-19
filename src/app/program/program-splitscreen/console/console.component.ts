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
import {ProgramOutput} from "src/app/shared/types/program-output";
import {ProgramOutputLine} from "src/app/shared/types/program-output-line";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

@Component({
    selector: "app-console",
    templateUrl: "./console.component.html",
    styleUrls: ["./console.component.scss"],
})
export class ConsoleComponent implements AfterViewInit, OnChanges {
    @Input() programOutput$!: Observable<ProgramOutput>;
    @Input() programState$!: Observable<ProgramState>;
    @Output() programInput = new EventEmitter<string>();

    programInputForm: FormControl<string> = new FormControl();

    @ViewChild("programInputArea") programInputArea!: ElementRef;

    ExecutionState = ExecutionState;

    lines: ProgramOutputLine[] = [];
    lastLine: ProgramOutputLine | undefined = undefined;

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
                .currentValue as Observable<ProgramOutput>;
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

    private get lastLineContent(): string {
        return this.lastLine?.content ?? "";
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
        if (!input.startsWith(this.lastLineContent)) {
            this.programInputForm.setValue(this.lastLineContent);
        } else {
            input = input.substring(this.lastLineContent.length);
            if (input.endsWith("\n")) {
                input = input.substring(0, input.length - 1);
                this.programInput.emit(input);
            }
        }
    }

    private onOutputReceived({lines, lastLine}: ProgramOutput) {
        this.lines = [...lines].reverse();
        this.lastLine = lastLine;
        this.programInputForm.setValue(this.lastLineContent);
        this.programInputAreaElement?.focus();
    }

    private onStateUpdated(state: ProgramState) {
        this.state = state;
    }
}
