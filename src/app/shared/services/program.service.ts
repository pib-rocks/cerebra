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
    programByIdResponse: Program | undefined;

    constructor(private apiService: ApiService) {}

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
                this.setPrograms(response["programs"] as Program[]);
            },
            error: console.log,
        });
    }

    getProgramByProgramNumber(programNumber: string) {
        this.apiService
            .get(UrlConstants.PROGRAM + `/${programNumber}`)
            .subscribe({
                next: (response) => {
                    this.programByIdResponse = response as Program;
                },
                error: console.log,
            });
    }

    createProgram(program: Program) {
        this.apiService.post(UrlConstants.PROGRAM, program).subscribe({
            next: (response) => {
                this.addProgram(response as Program);
            },
            error: console.log,
        });
    }

    updateProgramByProgramNumber(program: Program) {
        this.apiService
            .put(UrlConstants.PROGRAM + `/${program.programNumber}`, program)
            .subscribe({
                next: (response) => {
                    this.programByIdResponse = response as Program;
                    this.updateProgram(response);
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
