import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject, Observable, first, map} from "rxjs";
import {UrlConstants} from "./url.constants";
import {ProgramCode} from "../types/program-code";
import {UtilService} from "./util.service";
import {RosService} from "./ros-service/ros.service";
import {ExecutionState, ProgramState} from "../types/program-state";
import {GoalHandle} from "../ros-types/action/goal-handle";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../ros-types/action/run-program";
import {ProgramLogLine} from "../types/program-log-line";

@Injectable({
    providedIn: "root",
})
export class ProgramService {
    programs: Program[] = [];

    programNumberToCode: Map<string, ProgramCode> = new Map();
    programNumberToState: Map<string, BehaviorSubject<ProgramState>> =
        new Map();
    programNumberToLogs: Map<string, BehaviorSubject<ProgramLogLine[]>> =
        new Map();
    programNumberToCancel: Map<string, () => void> = new Map();
    programNumberToMpid: Map<string, number> = new Map();

    programsSubject: BehaviorSubject<Program[]> = new BehaviorSubject<
        Program[]
    >([]);

    constructor(
        private apiService: ApiService,
        private rosService: RosService,
        private utilService: UtilService,
    ) {
        this.getAllPrograms();
    }

    getProgramFromCache(programNumber: string): Program | undefined {
        const program = this.programs.find(
            (program) => program.programNumber === programNumber,
        );
        if (!program)
            console.warn(
                `no program with program-number '${programNumber}' in local cache.
            cache contains the following numbers: ${this.programs.map(
                (p) => p.programNumber,
            )}`,
            );
        return program;
    }

    getAllPrograms(): Observable<Program[]> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.PROGRAM),
            (response) => {
                const programs = (response["programs"] as Program[]).map(
                    (dto) => Program.fromDTO(dto),
                );
                this.setPrograms(programs);
                return programs;
            },
        );
    }

    getProgramByProgramNumber(programNumber: string): Observable<Program> {
        return UtilService.createResultObservable(
            this.apiService.get(UrlConstants.PROGRAM + `/${programNumber}`),
            (dto) => Program.fromDTO(dto),
        );
    }

    createProgram(program: Program): Observable<Program> {
        return UtilService.createResultObservable(
            this.apiService.post(UrlConstants.PROGRAM, program.toDTO()),
            (dto) => {
                const program = Program.fromDTO(dto);
                this.addProgram(program);
                return program;
            },
        );
    }

    updateProgramByProgramNumber(program: Program): Observable<Program> {
        return UtilService.createResultObservable(
            this.apiService.put(
                UrlConstants.PROGRAM + `/${program.programNumber}`,
                new Program(program.name).toDTO(),
            ),
            (dto) => {
                const program = Program.fromDTO(dto);
                this.updateProgram(program);
                return program;
            },
        );
    }

    deleteProgramByProgramNumber(programNumber: string): Observable<void> {
        return UtilService.createResultObservable(
            this.apiService.delete(UrlConstants.PROGRAM + `/${programNumber}`),
            (_) => this.deleteProgram(programNumber),
        );
    }

    getCodeByProgramNumber(programNumber: string): Observable<ProgramCode> {
        const code = this.getCodeFromCache(programNumber);
        return code
            ? new BehaviorSubject(code)
            : UtilService.createResultObservable(
                  this.apiService.get(
                      `${UrlConstants.PROGRAM}/${programNumber}/${UrlConstants.CODE}`,
                  ),
                  (code) => {
                      this.setCode(programNumber, code);
                      return code;
                  },
              );
    }

    updateCodeByProgramNumber(
        programNumber: string,
        code: ProgramCode,
    ): Observable<ProgramCode> {
        return UtilService.createResultObservable(
            this.apiService.put(
                `${UrlConstants.PROGRAM}/${programNumber}/${UrlConstants.CODE}`,
                code,
            ),
            (code) => {
                this.setCode(programNumber, code);
                return code;
            },
        );
    }

    runProgram(programNumber: string) {
        const programState: BehaviorSubject<ProgramState> =
            this.getProgramState(
                programNumber,
            ) as BehaviorSubject<ProgramState>;
        const currentExecutionState = programState.value.executionState;
        if (
            currentExecutionState !== ExecutionState.RUNNING &&
            currentExecutionState !== ExecutionState.STARTING
        ) {
            programState.next({executionState: ExecutionState.STARTING});
            const observable = this.rosService.runProgram(programNumber);
            observable.subscribe((handle) => {
                this.onRunProgramGoalReceive(programNumber, handle);
            });
        }
    }

    terminateProgram(programNumber: string) {
        const state = this.programNumberToState.get(programNumber);
        if (state?.value.executionState !== ExecutionState.RUNNING) return;
        if (!this.programNumberToCancel.has(programNumber)) return;
        this.programNumberToCancel.get(programNumber)!();
        state.next({executionState: ExecutionState.INTERRUPTED});
    }

    getProgramLogs(programNumber: string): Observable<ProgramLogLine[]> {
        return this.utilService.getFromMapOrDefault(
            this.programNumberToLogs,
            programNumber,
            () => new BehaviorSubject<ProgramLogLine[]>([]),
        );
    }

    getProgramState(programNumber: string): Observable<ProgramState> {
        return this.utilService.getFromMapOrDefault(
            this.programNumberToState,
            programNumber,
            () =>
                new BehaviorSubject<ProgramState>({
                    executionState: ExecutionState.NOT_STARTED,
                }),
        );
    }

    provideProgramInput(programNumber: string, input: string) {
        let mpid = this.programNumberToMpid.get(programNumber);
        if (mpid === undefined) {
            throw new Error(
                `no mpid associated with program '${programNumber}'`,
            );
        }
        this.rosService.publishProgramInput(input, mpid);
        const logsSubject = this.getProgramLogs(
            programNumber,
        ) as BehaviorSubject<ProgramLogLine[]>;
        const logs = logsSubject.value;
        const lastLine = logs[logs.length - 1];
        if (lastLine && !lastLine.hasInput) {
            lastLine.hasInput = true;
            lastLine.content = lastLine.content + input;
        } else {
            logs.push({
                content: input,
                isError: false,
                hasInput: true,
            });
        }
        logsSubject.next(logs);
    }

    private updateProgram(updateProgram: Program) {
        const index = this.programs.findIndex(
            (p) => p.programNumber === updateProgram.programNumber,
        );
        this.programs[index] = updateProgram;
        this.programsSubject.next(this.programs.slice());
    }

    private setPrograms(programs: Program[]) {
        this.programs = programs;
        this.programsSubject.next(this.programs.slice());
    }

    private addProgram(program: Program) {
        this.programs.push(program);
        this.programsSubject.next(this.programs.slice());
    }

    private deleteProgram(programNumber: string) {
        this.programs.splice(
            this.programs.findIndex((p) => p.programNumber === programNumber),
            1,
        );
        this.programsSubject.next(this.programs.slice());
    }

    private setCode(programNumber: string, code: ProgramCode) {
        this.programNumberToCode.set(programNumber, code);
    }

    private getCodeFromCache(programNumber: string): ProgramCode | undefined {
        return this.programNumberToCode.get(programNumber);
    }

    private onRunProgramGoalReceive(
        programNumber: string,
        handle: GoalHandle<RunProgramFeedback, RunProgramResult>,
    ) {
        handle.feedback
            .pipe(map((feedback) => feedback.mpid))
            .pipe(first())
            .subscribe((mpid) => {
                this.programNumberToMpid.set(programNumber, mpid);
            });

        const programState: BehaviorSubject<ProgramState> =
            this.getProgramState(
                programNumber,
            ) as BehaviorSubject<ProgramState>;
        programState.next({executionState: ExecutionState.RUNNING});

        const programLogs: BehaviorSubject<ProgramLogLine[]> =
            this.getProgramLogs(programNumber) as BehaviorSubject<
                ProgramLogLine[]
            >;
        programLogs.next([]);
        handle.feedback.subscribe((feedback) => {
            const logs = programLogs.value;
            logs.push(
                ...feedback.output_lines.map((outputLine) => ({
                    content: outputLine.content,
                    isError: outputLine.is_stderr,
                    hasInput: false,
                })),
            );
            programLogs.next(logs);
        });

        const resultSubscription = handle.result.subscribe((result) => {
            const resultExecutionState =
                result.exit_code == 0
                    ? ExecutionState.FINISHED_SUCCESSFUL
                    : ExecutionState.FINISHED_ERROR;
            programState.next({
                executionState: resultExecutionState,
                exitCode: result.exit_code,
            });
        });

        this.programNumberToCancel.set(programNumber, () => {
            resultSubscription.unsubscribe();
            handle.cancel();
        });
    }
}
