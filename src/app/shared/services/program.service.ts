import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject, Observable} from "rxjs";
import {UrlConstants} from "./url.constants";
import {ProgramCode} from "../types/program-code";
import {UtilService} from "./util.service";
import {RosService} from "./ros-service/ros.service";
import {ProgramOutputLine} from "../ros-types/msg/program-output-line";
import {ExecutionState, ProgramState} from "../types/program-state";

@Injectable({
    providedIn: "root",
})
export class ProgramService {
    programs: Program[] = [];

    programNumberToCode: Map<string, ProgramCode> = new Map();
    programNumberToState: Map<string, BehaviorSubject<ProgramState>> =
        new Map();
    programNumberToOutput: Map<string, BehaviorSubject<ProgramOutputLine[]>> =
        new Map();
    programNumberToCancel: Map<string, () => void> = new Map();

    programsSubject: BehaviorSubject<Program[]> = new BehaviorSubject<
        Program[]
    >([]);

    constructor(
        private apiService: ApiService,
        private rosService: RosService,
    ) {
        this.getAllPrograms();
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
            currentExecutionState == ExecutionState.RUNNING ||
            currentExecutionState == ExecutionState.STARTING
        )
            return;
        programState.next({executionState: ExecutionState.STARTING});

        this.rosService.runProgram(programNumber).subscribe((handle) => {
            programState.next({executionState: ExecutionState.RUNNING});
            this.programNumberToCancel.set(programNumber, handle.cancel);

            const programOutput: BehaviorSubject<ProgramOutputLine[]> =
                this.getProgramOutput(programNumber) as BehaviorSubject<
                    ProgramOutputLine[]
                >;
            programOutput.next([]);
            handle.feedback.subscribe((feedback) => {
                programOutput.next(
                    programOutput.getValue().concat(feedback.output_lines),
                );
            });

            handle.result.subscribe((result) => {
                const resultExecutionState =
                    result.exit_code == 0
                        ? ExecutionState.FINISHED_SUCCESSFUL
                        : ExecutionState.FINISHED_ERROR;
                programState.next({
                    executionState: resultExecutionState,
                    exitCode: result.exit_code,
                });
            });
        });
    }

    terminateProgram(programNumber: string) {
        const state = this.programNumberToState.get(programNumber);
        if (state?.value.executionState !== ExecutionState.RUNNING) return;
        this.programNumberToCancel.get(programNumber)!();
        state.next({executionState: ExecutionState.INTERRUPTED});
    }

    getProgramOutput(programNumber: string): Observable<ProgramOutputLine[]> {
        let outputObservable = this.programNumberToOutput.get(programNumber);
        if (!outputObservable) {
            outputObservable = new BehaviorSubject<ProgramOutputLine[]>([]);
            this.programNumberToOutput.set(programNumber, outputObservable);
        }
        return outputObservable;
    }

    getProgramState(programNumber: string): Observable<ProgramState> {
        let stateObservable = this.programNumberToState.get(programNumber);
        if (!stateObservable) {
            const initState: ProgramState = {
                executionState: ExecutionState.NOT_STARTED,
            };
            stateObservable = new BehaviorSubject(initState);
            this.programNumberToState.set(programNumber, stateObservable);
        }
        return stateObservable;
    }
}
