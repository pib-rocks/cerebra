import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {UrlConstants} from "./url.constants";
import {ProgramCode} from "../types/progran-code";

@Injectable({
    providedIn: "root",
})
export class ProgramService {
    programs: Program[] = [];
    codes: ProgramCode[] = [];
    programsSubject: BehaviorSubject<Program[]> = new BehaviorSubject<
        Program[]
    >([]);

    constructor(private apiService: ApiService) {
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

    private setCode(code: ProgramCode) {
        const index = this.codes.findIndex(
            (c) => c.programNumber === code.programNumber,
        );
        if (index === -1) this.codes.push(code);
        else this.codes[index] = code;
    }

    private getCodeFromCache(programNumber: string): ProgramCode | undefined {
        return this.codes.find((code) => code.programNumber === programNumber);
    }

    private createResultObservable<Type>(
        obs: Observable<any>,
        mapper: (response: any) => Type,
    ): Observable<Type> {
        const result: ReplaySubject<Type> = new ReplaySubject();
        obs.subscribe({
            next: (res) => result.next(mapper(res)),
            error: (err) => {
                console.log(err);
                result.error(err);
            },
        });
        return result;
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
        return this.createResultObservable(
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
        return this.createResultObservable(
            this.apiService.get(UrlConstants.PROGRAM + `/${programNumber}`),
            (dto) => Program.fromDTO(dto),
        );
    }

    createProgram(program: Program): Observable<Program> {
        return this.createResultObservable(
            this.apiService.post(UrlConstants.PROGRAM, program.toDTO()),
            (dto) => {
                const program = Program.fromDTO(dto);
                this.addProgram(program);
                return program;
            },
        );
    }

    updateProgramByProgramNumber(program: Program): Observable<Program> {
        return this.createResultObservable(
            this.apiService.put(
                UrlConstants.PROGRAM + `/${program.programNumber}`,
                program.toDTO(),
            ),
            (dto) => {
                const program = Program.fromDTO(dto);
                this.updateProgram(program);
                return program;
            },
        );
    }

    deleteProgramByProgramNumber(programNumber: string): Observable<void> {
        return this.createResultObservable(
            this.apiService.delete(UrlConstants.PROGRAM + `/${programNumber}`),
            (_) => this.deleteProgram(programNumber),
        );
    }

    getCodeByProgramNumber(programNumber: string): Observable<ProgramCode> {
        const code = this.getCodeFromCache(programNumber);
        return code
            ? new BehaviorSubject(code)
            : this.createResultObservable(
                  this.apiService.get(
                      `${UrlConstants.PROGRAM}/${programNumber}/${UrlConstants.CODE}`,
                  ),
                  (code) => {
                      this.setCode(code);
                      return code;
                  },
              );
    }

    updateCodeByProgramNumber(code: ProgramCode): Observable<ProgramCode> {
        return this.createResultObservable(
            this.apiService.put(
                `${UrlConstants.PROGRAM}/${code.programNumber}/${UrlConstants.CODE}`,
                code,
            ),
            (code) => {
                this.setCode(code);
                return code;
            },
        );
    }
}
