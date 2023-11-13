import {TestBed} from "@angular/core/testing";

import {ProgramService} from "./program.service";
import {ApiService} from "./api.service";
import {BehaviorSubject} from "rxjs";
import {Program, cloneProgram} from "../types/program";

describe("ProgramService", () => {
    let programService: ProgramService;
    let apiService: jasmine.SpyObj<ApiService>;

    let pro: Program[];
    let newPro: Program;

    let obs: BehaviorSubject<Program>[];
    let newObs: BehaviorSubject<Program>;
    let obsAll: BehaviorSubject<any>;

    beforeEach(() => {
        pro = [
            {
                programNumber: "id-0",
                name: "program_0",
                program: '{ x: "program_0" }',
            },
            {
                programNumber: "id-1",
                name: "program_1",
                program: '{ x: "program_1" }',
            },
            {
                programNumber: "id-2",
                name: "program_2",
                program: '{ x: "program_2" }',
            },
        ];

        newPro = {
            programNumber: "id-new",
            name: "program_new",
            program: '{ x: "program_new" }',
        };

        obs = pro.map((p) => new BehaviorSubject(p));
        newObs = new BehaviorSubject(newPro);
        obsAll = new BehaviorSubject({programs: pro});

        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            ApiService.name,
            ["get", "post", "put", "delete"],
        );
        apiServiceSpy.get.and.returnValue(new BehaviorSubject({programs: []}));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ApiService,
                    useValue: apiServiceSpy,
                },
                ProgramService,
            ],
        });

        programService = TestBed.inject(ProgramService);
        programService.programs = pro.map((p) => cloneProgram(p));
        programService.programsSubject = jasmine.createSpyObj<
            BehaviorSubject<Program[]>
        >("programSubjectSpy", ["next"]);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        apiService.get = jasmine.createSpy();
    });

    it("should be created", () => {
        expect(programService).toBeTruthy();
    });

    it("should update one program", () => {
        newPro.programNumber = pro[0].programNumber;
        programService["updateProgram"](newPro);
        const expectedPrograms = jasmine.arrayWithExactContents([
            jasmine.objectContaining(newPro),
            jasmine.objectContaining(pro[1]),
            jasmine.objectContaining(pro[2]),
        ]);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should set all programs", () => {
        programService["setPrograms"]([newPro]);
        const expectedPrograms = jasmine.arrayWithExactContents([
            jasmine.objectContaining(newPro),
        ]);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should add one program", () => {
        programService["addProgram"](newPro);
        const expectedPrograms = jasmine.arrayWithExactContents([
            jasmine.objectContaining(newPro),
            jasmine.objectContaining(pro[0]),
            jasmine.objectContaining(pro[1]),
            jasmine.objectContaining(pro[2]),
        ]);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should delete one program", () => {
        programService["deleteProgram"](pro[1].programNumber!);
        const expectedPrograms = jasmine.arrayWithExactContents([
            jasmine.objectContaining(pro[0]),
            jasmine.objectContaining(pro[2]),
        ]);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should get all programs from database", () => {
        const setPersonalitiesSpy = spyOn<any>(programService, "setPrograms");
        apiService.get.and.returnValue(obsAll);
        programService.getAllPrograms();
        expect(apiService.get).toHaveBeenCalledOnceWith("/program");
        expect(setPersonalitiesSpy).toHaveBeenCalledOnceWith(
            jasmine.arrayWithExactContents(pro),
        );
    });

    it("should get one program from database", () => {
        apiService.get.and.returnValue(obs[0]);
        programService.getProgramByProgramNumber(pro[0].programNumber!);
        expect(apiService.get).toHaveBeenCalledOnceWith("/program/id-0");
        expect(programService.programByProgramNumberResponse).toEqual(
            jasmine.objectContaining(pro[0]),
        );
    });

    it("should create one program in db", () => {
        const addProgramSpy = spyOn<any>(programService, "addProgram");
        apiService.post.and.returnValue(newObs);
        programService.createProgram(newPro);
        expect(apiService.post).toHaveBeenCalledOnceWith(
            "/program",
            jasmine.objectContaining({
                name: newPro.name,
                program: newPro.program,
            }),
        );
        expect(addProgramSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(newPro),
        );
    });

    it("should update one program in db", () => {
        const updateProgramSpy = spyOn<any>(programService, "updateProgram");
        apiService.put.and.returnValue(newObs);
        programService.updateProgramByProgramNumber(pro[1]);
        expect(apiService.put).toHaveBeenCalledOnceWith(
            "/program/id-1",
            pro[1],
        );
        expect(updateProgramSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(newPro),
        );
        expect();
    });

    it("should delete one program in db", () => {
        const deleteProgramSpy = spyOn<any>(programService, "deleteProgram");
        apiService.delete.and.returnValue(new BehaviorSubject(undefined));
        programService.deleteProgramByProgramNumber(pro[2].programNumber!);
        expect(apiService.delete).toHaveBeenCalledOnceWith("/program/id-2");
        expect(deleteProgramSpy).toHaveBeenCalledOnceWith("id-2");
    });
});
