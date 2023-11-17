import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramComponent} from "./program.component";
import {ProgramService} from "../shared/services/program.service";
import {Router} from "@angular/router";
import {ReactiveFormsModule} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {RouterTestingModule} from "@angular/router/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {Program} from "../shared/types/program";
import {BehaviorSubject} from "rxjs";

describe("ProgramComponent", () => {
    let component: ProgramComponent;
    let fixture: ComponentFixture<ProgramComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
    let modalService: jasmine.SpyObj<NgbModal>;
    let router: {url: string};

    beforeEach(async () => {
        const modalServiceSoy: jasmine.SpyObj<NgbModal> = jasmine.createSpyObj(
            NgbModal,
            ["open"],
        );
        const programServiceSpy: jasmine.SpyObj<ProgramService> =
            jasmine.createSpyObj(ProgramService, [
                "getProgramFromCache",
                "getAllPrograms",
                "getProgramByProgramNumber",
                "createProgram",
                "updateProgramByProgramNumber",
                "deleteProgramByProgramNumber",
            ]);

        router = {url: "change this"};

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                ReactiveFormsModule,
                RouterTestingModule,
            ],
            providers: [
                {
                    provide: ProgramService,
                    useValue: programServiceSpy,
                },
                {
                    provide: Router,
                    useValue: router,
                },
                {
                    provide: NgbModal,
                    useValue: modalServiceSoy,
                },
            ],
        }).compileComponents();

        programService = TestBed.inject(
            ProgramService,
        ) as jasmine.SpyObj<ProgramService>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

        fixture = TestBed.createComponent(ProgramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should process the promise returned by showModal() correctly, if it rejects", async () => {
        modalService.open.and.returnValue({
            result: Promise.reject(new Error("")),
        } as NgbModalRef);
        const result = fixture.componentInstance.showModal();
        await expectAsync(result).toBeResolved();
    });

    it("should process the promise returned by showModal() correctly, if it resolves", async () => {
        modalService.open.and.returnValue({
            result: Promise.resolve("result"),
        } as NgbModalRef);
        const result = fixture.componentInstance.showModal();
        await expectAsync(result).toBeRejectedWith(
            new Error('unexpected result: "result"'),
        );
    });

    it("should get the correct rpogram from the current route", () => {
        router.url = "program/id-0";
        const expected = new Program("testname");
        programService.getProgramFromCache.and.returnValue(expected);
        const result = fixture.componentInstance.getProgramFromRoute();
        expect(result).toEqual(expected);
    });

    it("should add a program", () => {
        const showModalSpy = spyOn(
            fixture.componentInstance,
            "showModal",
        ).and.returnValue({
            then: (callback) => {
                expect(fixture.componentInstance.nameFormControl.value).toEqual(
                    "",
                );
                fixture.componentInstance.nameFormControl.setValue("new-name");
                callback?.();
            },
        } as Promise<void>);
        const selectedSpy = spyOn(fixture.componentInstance.selected, "next");
        programService.createProgram.and.returnValue(
            new BehaviorSubject(new Program("new-name", {}, "id-0")),
        );

        fixture.componentInstance.addProgram();

        expect(showModalSpy).toHaveBeenCalled();
        expect(programService.createProgram).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                name: "new-name",
                program: {},
                programNumber: "",
            }),
        );
        expect(selectedSpy).toHaveBeenCalledOnceWith("id-0");
    });

    it("should edit a program", () => {
        const showModalSpy = spyOn(
            fixture.componentInstance,
            "showModal",
        ).and.returnValue({
            then: (callback) => {
                fixture.componentInstance.nameFormControl.setValue("new-name");
                callback?.();
            },
        } as Promise<void>);
        const expected = new Program("testname", {}, "id-0");
        const selectedSpy = spyOn(fixture.componentInstance.selected, "next");
        const getProgramSpy = spyOn(
            fixture.componentInstance,
            "getProgramFromRoute",
        ).and.returnValue(expected);
        programService.updateProgramByProgramNumber.and.returnValue(
            new BehaviorSubject(new Program("new-name", {}, "id-0")),
        );

        fixture.componentInstance.editProgram();

        expect(showModalSpy).toHaveBeenCalled();
        expect(
            programService.updateProgramByProgramNumber,
        ).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                name: "new-name",
                program: {},
                programNumber: "id-0",
            }),
        );
        expect(selectedSpy).toHaveBeenCalledOnceWith("id-0");
        expect(getProgramSpy).toHaveBeenCalledTimes(1);
    });

    it("should delete a program", () => {
        const expected = new Program("testname", {}, "id-0");
        const getProgramSpy = spyOn(
            fixture.componentInstance,
            "getProgramFromRoute",
        ).and.returnValue(expected);
        fixture.componentInstance.deleteProgram();
        expect(
            programService.deleteProgramByProgramNumber,
        ).toHaveBeenCalledOnceWith("id-0");
        expect(getProgramSpy).toHaveBeenCalledTimes(1);
    });
});
