import {TestBed} from "@angular/core/testing";

import {ProgramService} from "./program.service";
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable} from "rxjs";
import {Program} from "../types/program";

describe("ProgramService", () => {
    let programService: ProgramService;
    let apiService: jasmine.SpyObj<ApiService>;

    let proDto: {name: string; programNumber: string}[];
    let newProDto: {name: string; programNumber: string};

    let pro: Program[];
    let newPro: Program;

    let obs: BehaviorSubject<{name: string; programNumber: string}>[];
    let newObs: BehaviorSubject<{name: string; programNumber: string}>;
    let obsAll: BehaviorSubject<{
        programs: {name: string; programNumber: string}[];
    }>;

    beforeEach(() => {
        proDto = [
            {
                name: "name-0",
                programNumber: "id-0",
            },
            {
                name: "name-1",
                programNumber: "id-1",
            },
            {
                name: "name-2",
                programNumber: "id-2",
            },
        ];
        newProDto = {
            name: "name-new",
            programNumber: "id-new",
        };

        pro = [
            new Program("name-0", "id-0"),
            new Program("name-1", "id-1"),
            new Program("name-2", "id-2"),
        ];
        newPro = new Program("name-new", "id-new");

        obs = proDto.map((p) => new BehaviorSubject(p));
        newObs = new BehaviorSubject(newProDto);
        obsAll = new BehaviorSubject({programs: proDto});

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
        programService.programs = pro.map((program) => program.clone());
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
            newPro,
            pro[1],
            pro[2],
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
            newPro,
            pro[0],
            pro[1],
            pro[2],
        ]);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should delete one program", () => {
        const expectedPrograms = [pro[0], pro[2]];
        programService["deleteProgram"](pro[1].programNumber);
        expect(programService.programs).toEqual(expectedPrograms);
        expect(programService.programsSubject.next).toHaveBeenCalledOnceWith(
            expectedPrograms,
        );
    });

    it("should create a correct result observable with successful base observable", async () => {
        const baseObservable = new Observable((subscriber) =>
            subscriber.next(1),
        );
        const baseSubscribeSpy = spyOn(
            baseObservable,
            "subscribe",
        ).and.callThrough();
        const mapper = jasmine.createSpy("mapper", (_) => 2).and.callThrough();
        const resultObservable = programService["createResultObservable"](
            baseObservable,
            mapper,
        );
        const result = await new Promise((resolve, _) => {
            resultObservable.subscribe({next: (val) => resolve(val)});
        });
        expect(baseSubscribeSpy).toHaveBeenCalledTimes(1);
        expect(result).toEqual(2);
        expect(mapper).toHaveBeenCalledOnceWith(1);
    });

    it("should create a correct result observable with successful base observable", async () => {
        const baseObservable = new Observable((subscriber) =>
            subscriber.error(1),
        );
        const baseSubscribeSpy = spyOn(
            baseObservable,
            "subscribe",
        ).and.callThrough();
        const mapper = jasmine.createSpy("mapper", (_) => 2);
        const resultObservable = programService["createResultObservable"](
            baseObservable,
            mapper,
        );
        const error = await new Promise((resolve, _) => {
            resultObservable.subscribe({error: (val) => resolve(val)});
        });
        expect(baseSubscribeSpy).toHaveBeenCalledTimes(1);
        expect(error).toEqual(1);
        expect(mapper).not.toHaveBeenCalled();
    });

    it("should get one program from cache", () => {
        const result = programService.getProgramFromCache("id-0");
        expect(result).toEqual(pro[0]);
    });

    it("should get all programs from database", async () => {
        const setProgramSpy = spyOn<any>(programService, "setPrograms");
        apiService.get.and.returnValue(obsAll);
        const resultPrograms = await new Promise((resolve, _) => {
            programService.getAllPrograms().subscribe((val) => resolve(val));
        });
        expect(apiService.get).toHaveBeenCalledOnceWith("/program");
        expect(setProgramSpy).toHaveBeenCalledOnceWith(
            jasmine.arrayWithExactContents(pro),
        );
        expect(resultPrograms).toEqual(jasmine.arrayWithExactContents(pro));
    });

    it("should get one program from database", async () => {
        apiService.get.and.returnValue(obs[0]);
        const resultProgram = await new Promise((resolve, _) => {
            programService
                .getProgramByProgramNumber("id-0")
                .subscribe((val) => resolve(val));
        });
        expect(apiService.get).toHaveBeenCalledOnceWith("/program/id-0");
        expect(resultProgram).toEqual(pro[0]);
    });

    it("should create one program in db", async () => {
        const addProgramSpy = spyOn<any>(programService, "addProgram");
        apiService.post.and.returnValue(newObs);
        const resultProgram = await new Promise((resolve, _) => {
            programService
                .createProgram(newPro)
                .subscribe((val) => resolve(val));
        });
        expect(apiService.post).toHaveBeenCalledOnceWith(
            "/program",
            jasmine.objectContaining({
                name: "name-new",
            }),
        );
        expect(addProgramSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(newPro),
        );
        expect(resultProgram).toEqual(newPro);
    });

    it("should update one program in db", async () => {
        const updateProgramSpy = spyOn<any>(programService, "updateProgram");
        apiService.put.and.returnValue(newObs);
        const resultProgram = await new Promise((resolve, _) => {
            programService
                .updateProgramByProgramNumber(pro[1])
                .subscribe((val) => resolve(val));
        });
        expect(apiService.put).toHaveBeenCalledOnceWith(
            "/program/id-1",
            jasmine.objectContaining({
                name: "name-1",
            }),
        );
        expect(updateProgramSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(newPro),
        );
        expect(resultProgram).toEqual(newPro);
    });

    it("should delete one program in db", async () => {
        const deleteProgramSpy = spyOn<any>(programService, "deleteProgram");
        apiService.delete.and.returnValue(new BehaviorSubject(undefined));
        await new Promise((resolve, _) => {
            programService
                .deleteProgramByProgramNumber("id-2")
                .subscribe((val) => resolve(val));
        });
        expect(apiService.delete).toHaveBeenCalledOnceWith("/program/id-2");
        expect(deleteProgramSpy).toHaveBeenCalledOnceWith("id-2");
    });
});
