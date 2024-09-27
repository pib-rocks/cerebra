import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramSplitscreenComponent} from "./program-splitscreen.component";
import {AngularSplitModule} from "angular-split";
import {ActivatedRoute, Params} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";
import {BehaviorSubject, Subject} from "rxjs";
import {ProgramWorkspaceComponent} from "./program-workspace/program-workspace.component";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {HttpClientModule} from "@angular/common/http";
import {ProgramLogLine} from "src/app/shared/types/program-log-line";

describe("ProgramSplitscreenComponent", () => {
    let component: ProgramSplitscreenComponent;
    let fixture: ComponentFixture<ProgramSplitscreenComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
    let params: BehaviorSubject<Params>;
    let data: BehaviorSubject<Record<string, any>>;

    beforeEach(async () => {
        const programServiceSpy: jasmine.SpyObj<ProgramService> =
            jasmine.createSpyObj("ProgramService", [
                "getProgramFromCache",
                "getAllPrograms",
                "getProgramByProgramNumber",
                "createProgram",
                "updateProgramByProgramNumber",
                "deleteProgramByProgramNumber",
                "getCodeByProgramNumber",
                "updateCodeByProgramNumber",
                "runProgram",
                "terminateProgram",
                "getProgramLogs",
                "getProgramState",
            ]);

        params = new BehaviorSubject<Params>({"program-number": "id-0"});
        data = new BehaviorSubject<Params>({code: "{}"});

        await TestBed.configureTestingModule({
            declarations: [
                ProgramSplitscreenComponent,
                ProgramWorkspaceComponent,
            ],
            providers: [
                {
                    provide: ProgramService,
                    useValue: programServiceSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {params, data},
                },
            ],
            imports: [AngularSplitModule, HttpClientModule],
        }).compileComponents();
        programService = TestBed.inject(
            ProgramService,
        ) as jasmine.SpyObj<ProgramService>;
        fixture = TestBed.createComponent(ProgramSplitscreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should save the code", () => {
        component.codeVisualOld = "visual-old";
        component.codeVisualNew = "visual-new";
        component.codePython = "python";
        component.programNumber = "program-number";
        component.saveCode();
        expect(
            programService.updateCodeByProgramNumber,
        ).toHaveBeenCalledOnceWith("program-number", {
            codeVisual: "visual-new",
        });
        expect(component.codeVisualOld).toEqual("visual-new");
    });

    it("should run the program", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.NOT_STARTED;
        component.codeVisualOld = "visual-old";
        component.codeVisualNew = "visual-new";
        component.codePython = "python";
        component.runProgram();
        expect(programService.runProgram).toHaveBeenCalledWith("test-number");
        expect(programService.terminateProgram).not.toHaveBeenCalled();
        expect(component.inSplitMode).toBeTrue();
        expect(
            programService.updateCodeByProgramNumber,
        ).toHaveBeenCalledOnceWith("test-number", {
            codeVisual: "visual-new",
        });
        expect(component.codeVisualOld).toEqual("visual-new");
    });

    it("should terminate the program", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.RUNNING;
        component.runProgram();
        expect(programService.runProgram).not.toHaveBeenCalled();
        expect(programService.terminateProgram).toHaveBeenCalledWith(
            "test-number",
        );
        expect(component.inSplitMode).toBeTrue();
    });

    it("should do nothing", () => {
        component.inSplitMode = false;
        component.programNumber = "test-number";
        component.executionState = ExecutionState.STARTING;
        expect(programService.runProgram).not.toHaveBeenCalled();
        expect(programService.terminateProgram).not.toHaveBeenCalled();
    });

    it("should get visual code from the route", () => {
        const codeVisual = '{"some": "json"}';
        data.next({code: {codeVisual}});
        expect(component.codeVisualNew).toEqual(codeVisual);
        expect(component.codeVisualOld).toEqual(codeVisual);
    });

    it("should get the program-number from the route", () => {
        const programNumber = "test-number";
        component.programNumber = programNumber;

        const programLogs = new Subject<ProgramLogLine[]>();
        const programState = new Subject<ProgramState>();
        programService.getProgramLogs.and.returnValue(programLogs);
        programService.getProgramState.and.returnValue(programState);

        params.next({"program-number": programNumber});

        expect(programService.getProgramLogs).toHaveBeenCalledWith(
            programNumber,
        );
        expect(programService.getProgramState).toHaveBeenCalledWith(
            programNumber,
        );

        expect(component.programLogs$).toBe(programLogs);
        expect(component.programState$).toBe(programState);

        component.executionState = ExecutionState.RUNNING;
        programState.next({executionState: ExecutionState.FINISHED_ERROR});
        expect(component.executionState as ExecutionState).toEqual(
            ExecutionState.FINISHED_ERROR,
        );
    });
});
