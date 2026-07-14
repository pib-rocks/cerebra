import {ComponentFixture, TestBed} from "@angular/core/testing";
import {BehaviorSubject, of} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {ProgramSplitscreenComponent} from "src/app/program/program-overview/program-manager/program-splitscreen/program-splitscreen.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";

describe("ProgramSplitscreenComponent", () => {
    let component: ProgramSplitscreenComponent;
    let fixture: ComponentFixture<ProgramSplitscreenComponent>;
    let programService: {
        updateCodeByProgramNumber: jest.Mock;
        runProgram: jest.Mock;
        terminateProgram: jest.Mock;
        provideProgramInput: jest.Mock;
        getProgramLogs: jest.Mock;
        getProgramState: jest.Mock;
        getProgramFromCache: jest.Mock;
        getProgramByProgramNumber: jest.Mock;
    };
    let stateSubject: BehaviorSubject<ProgramState>;

    beforeEach(async () => {
        stateSubject = new BehaviorSubject<ProgramState>({
            executionState: ExecutionState.NOT_STARTED,
        });
        programService = {
            updateCodeByProgramNumber: jest
                .fn()
                .mockReturnValue(of({codeVisual: "{}"})),
            runProgram: jest.fn(),
            terminateProgram: jest.fn(),
            provideProgramInput: jest.fn(),
            getProgramLogs: jest.fn().mockReturnValue(of([])),
            getProgramState: jest
                .fn()
                .mockReturnValue(stateSubject.asObservable()),
            getProgramFromCache: jest
                .fn()
                .mockReturnValue({name: "Test", programNumber: "1"}),
            getProgramByProgramNumber: jest.fn(),
        };

        await TestBed.configureTestingModule({
            declarations: [ProgramSplitscreenComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                {provide: ProgramService, useValue: programService},
                {
                    provide: ActivatedRoute,
                    useValue: {
                        data: of({code: {codeVisual: '{"blocks":{}}'}}),
                        params: of({"program-number": "1"}),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramSplitscreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("UC-BLY-004: saveCode", () => {
        it("persists codeVisual via PUT /program/{n}/code", () => {
            component.programNumber = "1";
            component.codeVisualNew = '{"blocks":{"block-1":{}}}';
            component.codeVisualOld = "{}";

            component.saveCode();

            expect(
                programService.updateCodeByProgramNumber,
            ).toHaveBeenCalledWith("1", {
                codeVisual: '{"blocks":{"block-1":{}}}',
            });
            expect(component.codeVisualOld).toBe(component.codeVisualNew);
        });
    });

    describe("UC-BLY-006: runProgram", () => {
        it("saves code, enables split mode, and starts execution", () => {
            component.programNumber = "1";
            component.executionState = ExecutionState.NOT_STARTED;
            const saveSpy = jest.spyOn(component, "saveCode");

            component.runProgram();

            expect(saveSpy).toHaveBeenCalled();
            expect(component.inSplitMode).toBe(true);
            expect(programService.runProgram).toHaveBeenCalledWith("1");
        });

        it("EC-BLY-003: returns early when STARTING", () => {
            component.executionState = ExecutionState.STARTING;
            component.runProgram();
            expect(programService.runProgram).not.toHaveBeenCalled();
            expect(programService.terminateProgram).not.toHaveBeenCalled();
        });

        it("UC-BLY-007: terminates when RUNNING", () => {
            component.programNumber = "1";
            component.executionState = ExecutionState.RUNNING;
            component.runProgram();
            expect(programService.terminateProgram).toHaveBeenCalledWith("1");
        });
    });

    describe("UC-BLY-011: onProgramInputReceived", () => {
        it("forwards stdin to ProgramService.provideProgramInput", () => {
            component.programNumber = "1";
            component.onProgramInputReceived("hello");
            expect(programService.provideProgramInput).toHaveBeenCalledWith(
                "1",
                "hello",
            );
        });
    });
});
