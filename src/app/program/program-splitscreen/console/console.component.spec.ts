import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing";

import {ConsoleComponent} from "./console.component";
import {Subject} from "rxjs";
import {ProgramOutput} from "src/app/shared/types/program-output";
import {SimpleChange} from "@angular/core";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

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

    it("should  hui", () => {
        const programOutput$ = new Subject<ProgramOutput>();
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
        const firstLine = {isStderr: true, content: "first"};
        const secondLine = {isStderr: false, content: "second"};
        const lastLine = {isStderr: true, content: "last"};
        programOutput$.next({lines: [firstLine, secondLine], lastLine});

        expect(component.lines).toEqual([secondLine, firstLine]);
        expect(component.lastLine).toEqual(lastLine);
        expect(
            component.programInputArea.nativeElement.focus,
        ).toHaveBeenCalled();
        expect(component.programInputForm.value).toEqual(lastLine.content);
    });

    it("should  hui2", () => {
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
