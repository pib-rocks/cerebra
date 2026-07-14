import {TestBed} from "@angular/core/testing";
import {BehaviorSubject, of, Subject, throwError} from "rxjs";
import {ExecutionState, ProgramState} from "src/app/shared/types/program-state";
import {GoalHandle} from "src/app/shared/ros-types/action/goal-handle";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "src/app/shared/ros-types/action/run-program";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {ProgramService} from "src/app/shared/services/program.service";
import {ApiService} from "src/app/shared/services/api.service";
import {UtilService} from "src/app/shared/services/util.service";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {Program} from "src/app/shared/types/program";

describe("ProgramService", () => {
    let programService: ProgramService;
    let apiService: jest.Mocked<
        Pick<ApiService, "get" | "post" | "put" | "delete">
    >;
    let utilService: jest.Mocked<Pick<UtilService, "getFromMapOrDefault">>;
    let rosService: jest.Mocked<
        Pick<RosService, "runProgram" | "publishProgramInput">
    >;

    const programsDto = [
        {name: "Program A", programNumber: "1"},
        {name: "Program B", programNumber: "2"},
    ];

    beforeEach(() => {
        apiService = {
            get: jest.fn().mockReturnValue(of({programs: programsDto})),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
        };
        utilService = {
            getFromMapOrDefault: jest.fn(
                (
                    map: Map<string, unknown>,
                    key: string,
                    defaultValueGenerator: () => unknown,
                ) => {
                    let value = map.get(key);
                    if (value === undefined) {
                        value = defaultValueGenerator();
                        map.set(key, value);
                    }
                    return value;
                },
            ),
        };
        rosService = {
            runProgram: jest.fn(),
            publishProgramInput: jest.fn(),
        };

        TestBed.configureTestingModule({
            providers: [
                ProgramService,
                {provide: ApiService, useValue: apiService},
                {provide: UtilService, useValue: utilService},
                {provide: RosService, useValue: rosService},
            ],
        });

        programService = TestBed.inject(ProgramService);
        programService.programs = programsDto.map((dto) =>
            Program.fromDTO(dto),
        );
    });

    describe("UC-PROG-001: getAllPrograms", () => {
        it("calls GET /program and caches programs", (done) => {
            apiService.get.mockReturnValue(of({programs: programsDto}));

            programService.getAllPrograms().subscribe((programs) => {
                expect(apiService.get).toHaveBeenCalledWith(
                    UrlConstants.PROGRAM,
                );
                expect(programs).toHaveLength(2);
                expect(programs[0].name).toBe("Program A");
                expect(programService.programsSubject.value).toHaveLength(2);
                done();
            });
        });
    });

    describe("UC-PROG-002: createProgram", () => {
        it("calls POST /program with { name }", (done) => {
            const newDto = {name: "New Program", programNumber: "3"};
            apiService.post.mockReturnValue(of(newDto));

            programService
                .createProgram(new Program("New Program"))
                .subscribe((program) => {
                    expect(apiService.post).toHaveBeenCalledWith(
                        UrlConstants.PROGRAM,
                        {name: "New Program"},
                    );
                    expect(program.programNumber).toBe("3");
                    expect(
                        programService.programs.some(
                            (p) => p.name === "New Program",
                        ),
                    ).toBe(true);
                    done();
                });
        });
    });

    describe("UC-BLY-004: updateCodeByProgramNumber", () => {
        it("calls PUT /program/{n}/code with { codeVisual }", (done) => {
            const codeVisual = '{"blocks":{}}';
            apiService.put.mockReturnValue(of({codeVisual}));

            programService
                .updateCodeByProgramNumber("1", {codeVisual})
                .subscribe((code) => {
                    expect(apiService.put).toHaveBeenCalledWith(
                        `${UrlConstants.PROGRAM}/1/${UrlConstants.CODE}`,
                        {codeVisual},
                    );
                    expect(code.codeVisual).toBe(codeVisual);
                    done();
                });
        });
    });

    describe("UC-BLY-006: runProgram", () => {
        it("transitions STARTING → RUNNING and sends only program_number via ROS", () => {
            const feedback$ = new Subject<RunProgramFeedback>();
            const result$ = new Subject<RunProgramResult>();
            const handle: GoalHandle<RunProgramFeedback, RunProgramResult> = {
                feedback: feedback$.asObservable(),
                result: result$.asObservable(),
                status: new Subject<number>().asObservable(),
                cancel: jest.fn(),
            };
            rosService.runProgram.mockReturnValue(of(handle));

            const states: ExecutionState[] = [];
            (
                programService.getProgramState("1") as BehaviorSubject<{
                    executionState: ExecutionState;
                }>
            ).subscribe((s) => states.push(s.executionState));

            programService.runProgram("1");

            expect(rosService.runProgram).toHaveBeenCalledWith("1");
            expect(rosService.runProgram).toHaveBeenCalledTimes(1);
            expect(states).toContain(ExecutionState.STARTING);

            feedback$.next({
                mpid: 7,
                output_lines: [{content: "hello", is_stderr: false}],
            });
            expect(states).toContain(ExecutionState.RUNNING);

            result$.next({exit_code: 0});
            expect(states).toContain(ExecutionState.FINISHED_SUCCESSFUL);
        });

        it("EC-BLY-003: does not start a second ROS call while STARTING", () => {
            rosService.runProgram.mockReturnValue(new Subject().asObservable());
            programService.runProgram("1");
            programService.runProgram("1");
            expect(rosService.runProgram).toHaveBeenCalledTimes(1);
        });
    });

    describe("UC-BLY-007: terminateProgram", () => {
        it("sets executionState to INTERRUPTED when RUNNING", () => {
            const cancel = jest.fn();
            const stateSubject = new BehaviorSubject({
                executionState: ExecutionState.RUNNING,
            });
            programService.programNumberToState.set("1", stateSubject);
            programService.programNumberToCancel.set("1", cancel);

            programService.terminateProgram("1");

            expect(cancel).toHaveBeenCalled();
            expect(stateSubject.value.executionState).toBe(
                ExecutionState.INTERRUPTED,
            );
        });
    });

    describe("UC-BLY-010: console log classification", () => {
        it("maps is_stderr to ProgramLogLine.isError", () => {
            const feedback$ = new Subject<RunProgramFeedback>();
            const result$ = new Subject<RunProgramResult>();
            rosService.runProgram.mockReturnValue(
                of({
                    feedback: feedback$.asObservable(),
                    result: result$.asObservable(),
                    status: new Subject<number>().asObservable(),
                    cancel: jest.fn(),
                }),
            );

            const logs: {isError: boolean}[] = [];
            programService
                .getProgramLogs("1")
                .subscribe((l) => logs.push(...l));

            programService.runProgram("1");
            feedback$.next({
                mpid: 1,
                output_lines: [
                    {content: "[INFO] node log", is_stderr: true},
                    {content: "stdout line", is_stderr: false},
                ],
            });

            expect(logs[0].isError).toBe(true);
            expect(logs[1].isError).toBe(false);
        });
    });

    describe("UC-BLY-011 / EC-BLY-004: provideProgramInput", () => {
        it("publishes /program_input with mpid when RUNNING", () => {
            programService.programNumberToMpid.set("1", 42);

            programService.provideProgramInput("1", "42");

            expect(rosService.publishProgramInput).toHaveBeenCalledWith(
                "42",
                42,
            );
        });

        it("throws when mpid is not assigned", () => {
            expect(() => programService.provideProgramInput("1", "42")).toThrow(
                "no mpid associated with program '1'",
            );
        });
    });

    describe("EC-HTTP-001: HTTP 500 on getAllPrograms", () => {
        it("propagates error via createResultObservable", (done) => {
            apiService.get.mockReturnValue(
                throwError(() => ({
                    status: 500,
                    message: "Internal Server Error",
                })),
            );

            programService.getAllPrograms().subscribe({
                error: (err) => {
                    expect(err.status).toBe(500);
                    done();
                },
            });
        });
    });
});
