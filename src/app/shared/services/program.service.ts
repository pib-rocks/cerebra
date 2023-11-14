import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {Program} from "../types/program";
import {BehaviorSubject} from "rxjs";
import {UrlConstants} from "./url.constants";

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

    getAllPrograms() {
        this.apiService.get(UrlConstants.PROGRAM).subscribe({
            next: (response) => {
                const programDTOs: Program[] = response["programs"];
                this.setPrograms(
                    programDTOs.map((dto) => Program.fromDTO(dto)),
                );
            },
            error: console.log,
        });
    }

    getProgram(programNumber: string) {
        const program = this.programs.find(
            (program) => program.programNumber === programNumber,
        );
        if (program) return program;
        else
            throw new Error(
                `no program with program-number '${programNumber}' in local cache.`,
            );
    }

    getProgramByProgramNumber(programNumber: string) {
        this.apiService
            .get(UrlConstants.PROGRAM + `/${programNumber}`)
            .subscribe({
                next: (response) => {
                    this.programByProgramNumberResponse =
                        Program.fromDTO(response);
                },
                error: console.log,
            });
    }

    createProgram(program: Program) {
        this.apiService
            .post(UrlConstants.PROGRAM, {
                name: program.name,
                program: program.program,
            })
            .subscribe({
                next: (response) => {
                    this.addProgram(Program.fromDTO(response));
                },
                error: console.log,
            });
    }

    updateProgramByProgramNumber(program: Program) {
        this.apiService
            .put(UrlConstants.PROGRAM + `/${program.programNumber}`, {
                name: program.name,
                program: program.program,
            })
            .subscribe({
                next: (response) => {
                    const program = Program.fromDTO(response);
                    this.programByProgramNumberResponse = program;
                    this.updateProgram(program);
                },
                error: console.log,
            });
    }

    deleteProgramByProgramNumber(programNumber: string) {
        this.apiService
            .delete(UrlConstants.PROGRAM + `/${programNumber}`)
            .subscribe({
                next: () => {
                    this.deleteProgram(programNumber);
                },
                error: console.log,
            });
    }
}
