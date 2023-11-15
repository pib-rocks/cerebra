import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject, Observable, catchError, map, throwError} from "rxjs";
import {UrlConstants} from "./url.constants";
import {NameType} from "blockly/core/names";

@Injectable({
    providedIn: "root",
})
export class ProgramService {
    programs: Program[] = [];
    programsSubject: BehaviorSubject<Program[]> = new BehaviorSubject<
        Program[]
    >([]);
    programByProgramNumberResponse: Program | undefined;

    constructor(private apiService: ApiService) {
        this.getAllPrograms();
    }

    private updateProgram(updateProgram: Program) {
        console.info(this.programs);
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

    private finalizeObs<Type>(
        obs: Observable<any>,
        mapper: (response: any) => Type,
    ): Observable<Type> {
        return obs.pipe(map(mapper)).pipe(
            catchError((err) => {
                console.log(err);
                return throwError(() => err);
            }),
        );
    }

    getProgramFromCache(programNumber: string): Program {
        const program = this.programs.find(
            (program) => program.programNumber === programNumber,
        );
        if (program) {
            return program;
        } else {
            throw new Error(
                `no program with program-number '${programNumber}' in local cache.
                cache contains the following numbers: ${this.programs.map(
                    (p) => p.programNumber,
                )}`,
            );
        }
    }

    getAllPrograms(): Observable<Program[]> {
        const result = this.finalizeObs(
            this.apiService.get(UrlConstants.PROGRAM),
            (response) =>
                (response["programs"] as Program[]).map((dto) =>
                    Program.fromDTO(dto),
                ),
        );
        result.subscribe((programs) => this.setPrograms(programs));
        return result;
    }

    getProgramByProgramNumber(programNumber: string): Observable<Program> {
        const result = this.finalizeObs(
            this.apiService.get(UrlConstants.PROGRAM + `/${programNumber}`),
            (response) => Program.fromDTO(response),
        );
        result.subscribe(
            (program) => (this.programByProgramNumberResponse = program),
        );
        return result;
    }

    createProgram(program: Program): Observable<Program> {
        const result = this.finalizeObs(
            this.apiService.post(UrlConstants.PROGRAM, {
                name: program.name,
                program: program.program,
            }),
            (response) => Program.fromDTO(response),
        );
        result.subscribe((program) => this.addProgram(program));
        return result;
    }

    updateProgramByProgramNumber(program: Program): Observable<Program> {
        const result = this.finalizeObs(
            this.apiService.put(
                UrlConstants.PROGRAM + `/${program.programNumber}`,
                {
                    name: program.name,
                    program: program.program,
                },
            ),
            (response) => Program.fromDTO(response),
        );
        result.subscribe((program) => this.updateProgram(program));
        return result;
    }

    deleteProgramByProgramNumber(programNumber: string): Observable<void> {
        const result = this.finalizeObs(
            this.apiService.delete(UrlConstants.PROGRAM + `/${programNumber}`),
            (_) => {},
        );
        result.subscribe((_) => this.deleteProgram(programNumber));
        return result;
    }
}
