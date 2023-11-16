import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {
    BehaviorSubject,
    Observable,
    ReplaySubject,
    catchError,
    map,
    throwError,
} from "rxjs";
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
            (response) => Program.fromDTO(response),
        );
    }

    createProgram(program: Program): Observable<Program> {
        return this.createResultObservable(
            this.apiService.post(UrlConstants.PROGRAM, {
                name: program.name,
                program: program.program,
            }),
            (response) => {
                const program = Program.fromDTO(response);
                this.addProgram(program);
                return program;
            },
        );
    }

    updateProgramByProgramNumber(program: Program): Observable<Program> {
        return this.createResultObservable(
            this.apiService.put(
                UrlConstants.PROGRAM + `/${program.programNumber}`,
                {
                    name: program.name,
                    program: program.program,
                },
            ),
            (response) => {
                const program = Program.fromDTO(response);
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
}
