import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramComponent} from "./program.component";
import {ProgramService} from "../shared/services/program.service";
import {ActivatedRoute, Router, UrlSegment} from "@angular/router";
import {ReactiveFormsModule} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {RouterTestingModule} from "@angular/router/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {Program} from "../shared/types/program";
import {BehaviorSubject, Observable, of} from "rxjs";

describe("ProgramComponent", () => {
    let component: ProgramComponent;
    let fixture: ComponentFixture<ProgramComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
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
        programServiceSpy.getAllPrograms.and.returnValue(
            new BehaviorSubject([]),
        );

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
                {
                    provide: ActivatedRoute,
                    useValue: {url: new Observable<UrlSegment[]>()},
                },
            ],
        }).compileComponents();

        programService = TestBed.inject(
            ProgramService,
        ) as jasmine.SpyObj<ProgramService>;

        fixture = TestBed.createComponent(ProgramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get the correct program from the current route", () => {
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
                callback?.("");
            },
        } as Promise<string>);
        const selectedSpy = spyOn(fixture.componentInstance.selected, "next");
        programService.createProgram.and.returnValue(
            new BehaviorSubject(new Program("new-name", "id-0")),
        );

        fixture.componentInstance.addProgram("");
        expect(showModalSpy).toHaveBeenCalled();
        expect(programService.createProgram).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                name: "new-name",
                programNumber: "",
            }),
        );
        expect(selectedSpy).toHaveBeenCalledOnceWith("id-0");
    });

    it("should edit a program", () => {
        const oldProgram = new Program("testname", "id-0");

        const showModalSpy = spyOn(component, "showModal").and.returnValue({
            then: (callback) => {
                component.nameFormControl.setValue("new-name");
                callback?.("");
            },
        } as Promise<string>);
        programService.getProgramByProgramNumber.and.returnValue(
            of(oldProgram),
        );
        programService.updateProgramByProgramNumber.and.returnValue(
            new BehaviorSubject(new Program("new-name", "id-0")),
        );
        component.editProgram("id-0");

        expect(showModalSpy).toHaveBeenCalled();
        expect(
            programService.updateProgramByProgramNumber,
        ).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                name: "new-name",
                programNumber: "id-0",
            }),
        );
    });

    it("should delete a program", () => {
        const selectedSpy = spyOn(fixture.componentInstance.selected, "next");
        programService.deleteProgramByProgramNumber.and.returnValue(
            new BehaviorSubject(undefined),
        );
        programService.programs = [new Program("testname", "id-1")];
        fixture.componentInstance.deleteProgram(
            programService.programs[0].getUUID(),
        );
        expect(selectedSpy).toHaveBeenCalledOnceWith("id-1");
    });
});
