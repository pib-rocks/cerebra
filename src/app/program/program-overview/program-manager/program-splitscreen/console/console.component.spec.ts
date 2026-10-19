import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ConsoleComponent} from "./console.component";
import {BehaviorSubject, Subject} from "rxjs";
import {SimpleChange, provideZonelessChangeDetection} from "@angular/core";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";
import {ReactiveFormsModule} from "@angular/forms";

describe("ConsoleComponent", () => {
    let component: ConsoleComponent;
    let fixture: ComponentFixture<ConsoleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, ConsoleComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ConsoleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the logs from the program-service", () => {
        const programLogs$ = new Subject<ProgramLogLine[]>();
        component.ngOnChanges({
            programLogs$: {
                currentValue: programLogs$,
            } as SimpleChange,
        });
        component.programInputArea = {
            nativeElement: {
                focus: jasmine.createSpy("focus"),
            },
        };
        const firstLine = {isError: true, content: "first", hasInput: false};
        const secondLine = {isError: false, content: "second", hasInput: false};
        const lastLine = {isError: true, content: "last", hasInput: false};
        programLogs$.next([firstLine, secondLine, lastLine]);

        expect(component.logs).toEqual([secondLine, firstLine]);
        expect(component.lastLogLineIfInput).toEqual(lastLine);
        expect(
            component.programInputArea.nativeElement.focus,
        ).toHaveBeenCalled();
        expect(component.programInputForm.value).toEqual(lastLine.content);

        lastLine.hasInput = true;
        programLogs$.next([firstLine, secondLine, lastLine]);
        expect(component.logs).toEqual([lastLine, secondLine, firstLine]);
        expect(component.lastLogLineIfInput).toEqual(undefined);

        programLogs$.next([]);
        expect(component.logs).toEqual([]);
        expect(component.lastLogLineIfInput).toEqual(undefined);
    });

    it("should get the state from the program-service", () => {
        const programState$ = new Subject<ProgramState>();
        component.ngOnChanges({
            programState$: {
                currentValue: programState$,
            } as SimpleChange,
        });
        const state: ProgramState = {
            executionState: ExecutionState.RUNNING,
        };
        programState$.next(state);
        expect(component.state).toEqual(state);
    });
});

describe("ConsoleComponent without zone.js", () => {
    let fixture: ComponentFixture<ConsoleComponent>;
    let logs$: BehaviorSubject<ProgramLogLine[]>;
    let state$: BehaviorSubject<ProgramState>;

    const consoleArea = () =>
        fixture.nativeElement.querySelector("#console-area") as HTMLElement;
    const consoleText = () =>
        consoleArea().textContent!.replace(/\s+/g, " ").trim();
    const inputArea = () =>
        fixture.nativeElement.querySelector(
            "#program-input-area",
        ) as HTMLTextAreaElement | null;
    const outputLines = () =>
        Array.from(
            consoleArea().querySelectorAll<HTMLElement>(
                "div.stdout, div.stderr",
            ),
        ).map((line) => ({
            content: line.textContent!.trim(),
            isError: line.classList.contains("stderr"),
        }));
    const line = (content: string, isError = false): ProgramLogLine => ({
        content,
        isError,
        hasInput: false,
    });

    // Delivers the emission from a later macrotask, the way a rosbridge
    // WebSocket message arrives: outside any Angular event handler and after
    // the last change detection has finished. Nothing in these tests runs
    // fixture.detectChanges() or a user event after such an emission.
    const emitLater = (emit: () => void) =>
        new Promise<void>((resolve) =>
            setTimeout(() => {
                emit();
                resolve();
            }),
        );

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConsoleComponent],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        logs$ = new BehaviorSubject<ProgramLogLine[]>([]);
        state$ = new BehaviorSubject<ProgramState>({
            executionState: ExecutionState.NOT_STARTED,
        });
        fixture = TestBed.createComponent(ConsoleComponent);
        fixture.componentRef.setInput("programLogs$", logs$);
        fixture.componentRef.setInput("programState$", state$);
        await fixture.whenStable();
    });

    it("renders a finished print-only run as soon as its messages arrive", async () => {
        expect(consoleText()).toContain("Program has not started yet");

        await emitLater(() =>
            state$.next({executionState: ExecutionState.STARTING}),
        );
        await fixture.whenStable();
        expect(consoleText()).toContain("Starting execution of program...");
        expect(consoleText()).not.toContain("Program has not started yet");

        await emitLater(() => {
            state$.next({executionState: ExecutionState.RUNNING});
            logs$.next([]);
        });
        await fixture.whenStable();
        expect(consoleText()).toContain("Program is now executing");
        expect(inputArea()).not.toBeNull();

        await emitLater(() => logs$.next([line("hello world")]));
        await fixture.whenStable();
        expect(inputArea()!.value).toBe("hello world");

        await emitLater(() =>
            state$.next({
                executionState: ExecutionState.FINISHED_SUCCESSFUL,
                exitCode: 0,
            }),
        );
        await fixture.whenStable();
        expect(inputArea()).toBeNull();
        expect(outputLines()).toEqual([
            {content: "hello world", isError: false},
        ]);
        expect(consoleText()).toContain(
            "Program has finished successfully (exit code: 0)",
        );
    });

    it("renders every output line in order with its error styling", async () => {
        await emitLater(() => {
            state$.next({executionState: ExecutionState.RUNNING});
            logs$.next([]);
        });
        await fixture.whenStable();

        await emitLater(() =>
            logs$.next([line("first"), line("second", true), line("third")]),
        );
        await fixture.whenStable();
        expect(outputLines()).toEqual([
            {content: "second", isError: true},
            {content: "first", isError: false},
        ]);
        expect(inputArea()!.value).toBe("third");

        await emitLater(() =>
            state$.next({
                executionState: ExecutionState.FINISHED_ERROR,
                exitCode: 1,
            }),
        );
        await fixture.whenStable();
        expect(outputLines()).toEqual([
            {content: "third", isError: false},
            {content: "second", isError: true},
            {content: "first", isError: false},
        ]);
        expect(consoleText()).toContain(
            "Program has finished with errors (exit code: 1)",
        );
    });

    it("keeps the trailing output line editable and styled while running", async () => {
        await emitLater(() => {
            state$.next({executionState: ExecutionState.RUNNING});
            logs$.next([line("name? ")]);
        });
        await fixture.whenStable();
        expect(inputArea()!.value).toBe("name? ");
        expect(inputArea()!.classList).toContain("stdout");

        await emitLater(() => logs$.next([line("name?"), line("oops", true)]));
        await fixture.whenStable();
        expect(inputArea()!.value).toBe("oops");
        expect(inputArea()!.classList).toContain("stderr");
        expect(outputLines()).toEqual([{content: "name?", isError: false}]);
    });

    it("replaces the previous output on a consecutive run", async () => {
        await emitLater(() => {
            state$.next({executionState: ExecutionState.RUNNING});
            logs$.next([line("run one")]);
        });
        await emitLater(() =>
            state$.next({
                executionState: ExecutionState.FINISHED_SUCCESSFUL,
                exitCode: 0,
            }),
        );
        await fixture.whenStable();
        expect(outputLines()).toEqual([{content: "run one", isError: false}]);

        await emitLater(() =>
            state$.next({executionState: ExecutionState.STARTING}),
        );
        await fixture.whenStable();
        expect(consoleText()).not.toContain("Program has finished");
        expect(consoleText()).toContain("Starting execution of program...");

        await emitLater(() => {
            state$.next({executionState: ExecutionState.RUNNING});
            logs$.next([]);
        });
        await emitLater(() => logs$.next([line("run two")]));
        await emitLater(() =>
            state$.next({executionState: ExecutionState.INTERRUPTED}),
        );
        await fixture.whenStable();
        expect(outputLines()).toEqual([{content: "run two", isError: false}]);
        expect(consoleText()).toContain(
            "Program execution has been interrupted by the user.",
        );
    });

    it("stops listening when destroyed", async () => {
        expect(logs$.observed).toBeTrue();
        expect(state$.observed).toBeTrue();

        fixture.destroy();

        expect(logs$.observed).toBeFalse();
        expect(state$.observed).toBeFalse();
        await expectAsync(
            emitLater(() => {
                state$.next({executionState: ExecutionState.RUNNING});
                logs$.next([line("late")]);
            }),
        ).toBeResolved();
    });
});
