import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ConsoleComponent} from "./console.component";
import {Subject} from "rxjs";
import {SimpleChange} from "@angular/core";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";

describe("ConsoleComponent", () => {
    let component: ConsoleComponent;
    let fixture: ComponentFixture<ConsoleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConsoleComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ConsoleComponent);
        component = fixture.componentInstance;
        component.programInputArea = {nativeElement: undefined};
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the lines from the program-service", () => {
        const programOutput$ = new Subject<ProgramLogLine[]>();
        component.ngOnChanges({
            programOutput$: {
                currentValue: programOutput$,
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
        programOutput$.next([firstLine, secondLine, lastLine]);

        expect(component.lines).toEqual([secondLine, firstLine]);
        expect(component.lastLineIfInput).toEqual(lastLine);
        expect(
            component.programInputArea.nativeElement.focus,
        ).toHaveBeenCalled();
        expect(component.programInputForm.value).toEqual(lastLine.content);

        lastLine.hasInput = true;
        programOutput$.next([firstLine, secondLine, lastLine]);
        expect(component.lines).toEqual([lastLine, secondLine, firstLine]);
        expect(component.lastLineIfInput).toEqual(undefined);

        programOutput$.next([]);
        expect(component.lines).toEqual([]);
        expect(component.lastLineIfInput).toEqual(undefined);
    });

    it("should  get the state from the program-service", () => {
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
