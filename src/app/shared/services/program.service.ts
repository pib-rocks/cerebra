import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject, Observable, filter, first} from "rxjs";
import {UrlConstants} from "./url.constants";
import {ProgramCode} from "../types/program-code";
import {UtilService} from "./util.service";
import {RosService} from "./ros-service/ros.service";
import {ProgramOutputLine} from "../types/program-output-line";
import {ExecutionState, ProgramState} from "../types/program-state";
import {GoalHandle} from "../ros-types/action/goal-handle";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../ros-types/action/run-program";
import {ProgramPrompt} from "../ros-types/msg/program-prompt";

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
    programNumberToPrompt: Map<string, BehaviorSubject<string | undefined>> =
        new Map();
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
        if (!this.programNumberToPrompt.get(programNumber)) {
            const subject = new BehaviorSubject<string | undefined>(undefined);
            this.programNumberToPrompt.set(programNumber, subject);
        }
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
            this.rosService.runProgram(programNumber).subscribe((handle) => {
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

    getProgramOutput(programNumber: string): Observable<ProgramOutputLine[]> {
        return this.utilService.getFromMapOrDefault(
            this.programNumberToOutput,
            programNumber,
            () => new BehaviorSubject<ProgramOutputLine[]>([]),
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

    getProgramPrompt(programNumber: string): Observable<string> {
        const subject = this.utilService.getFromMapOrDefault(
            this.programNumberToPrompt,
            programNumber,
            () => new BehaviorSubject<string | undefined>(undefined),
        );
        return subject.pipe(
            filter((prompt) => prompt !== undefined),
        ) as Observable<string>;
    }

    provideProgramInput(programNumber: string, input: string) {
        const mpid = this.programNumberToMpid.get(programNumber);
        if (!mpid) {
            throw new Error(
                `no mpid associated with program '${programNumber}'`,
            );
        }
        this.rosService.publishProgramInput(input, mpid, true);
    }

    declineProgramInput(programNumber: string) {
        const mpid = this.programNumberToMpid.get(programNumber);
        if (!mpid) {
            throw new Error(
                `no mpid associated with program '${programNumber}'`,
            );
        }
        this.rosService.publishProgramInput("", mpid, false);
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
        // it is theoretically possible, that we receive the first
        // prompt before we receive the mpid of the newly created process,
        // so we should buffer all incoming prompts inbetween
        const promptBuffer: ProgramPrompt[] = [];
        let promptSubscription =
            this.rosService.programPromptReceiver$.subscribe((prompt) =>
                promptBuffer.push(prompt),
            );
        const promptSubject = this.programNumberToPrompt.get(programNumber)!;
        // wait for the first feedback, to receive the mpid of the newly
        // created process, then
        handle.feedback.pipe(first()).subscribe((output) => {
            const mpid = output.mpid;
            this.programNumberToMpid.set(programNumber, mpid);
            promptSubscription.unsubscribe();
            const initialPrompt = promptBuffer.find(
                (prompt) => prompt.mpid === mpid,
            );
            promptSubject.next(initialPrompt?.prompt);
            promptSubscription = this.rosService.programPromptReceiver$
                .pipe(filter((prompt) => prompt.mpid === mpid))
                .subscribe((prompt) => promptSubject.next(prompt.prompt));
        });

        const programState: BehaviorSubject<ProgramState> =
            this.getProgramState(
                programNumber,
            ) as BehaviorSubject<ProgramState>;
        programState.next({executionState: ExecutionState.RUNNING});

        const programOutput: BehaviorSubject<ProgramOutputLine[]> =
            this.getProgramOutput(programNumber) as BehaviorSubject<
                ProgramOutputLine[]
            >;
        programOutput.next([]);
        handle.feedback.subscribe((feedback) => {
            const lines: ProgramOutputLine[] = feedback.output_lines.map(
                (lineRos) => ({
                    content: lineRos.content,
                    isStderr: lineRos.is_stderr,
                }),
            );
            programOutput.next(programOutput.getValue().concat(lines));
        });

        const resultSubscription = handle.result.subscribe((result) => {
            promptSubscription.unsubscribe();
            promptSubject.next(undefined);
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
            promptSubscription.unsubscribe();
            resultSubscription.unsubscribe();
            handle.cancel();
        });
    }
}
