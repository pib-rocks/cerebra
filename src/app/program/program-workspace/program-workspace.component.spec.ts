import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramWorkspaceComponent} from "./program-workspace.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {ActivatedRoute, Params} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {Program} from "src/app/shared/types/program";
import * as Blockly from "blockly";

describe("ProgramWorkspaceComponent", () => {
    let component: ProgramWorkspaceComponent;
    let fixture: ComponentFixture<ProgramWorkspaceComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
    let params: BehaviorSubject<Params>;

    beforeEach(async () => {
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
            new BehaviorSubject([
                new Program("name-0", {testfield: "0"}, "id-0"),
                new Program("name-1", {testfield: "1"}, "id-1"),
                new Program("name-2", {testfield: "2"}, "id-2"),
            ]),
        );

        params = new BehaviorSubject<Params>({uuid: "id-0"});

        await TestBed.configureTestingModule({
            declarations: [ProgramWorkspaceComponent],
            providers: [
                {
                    provide: ProgramService,
                    useValue: programServiceSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params,
                        snapshot: {
                            params: {
                                uuid: "id-1",
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        programService = TestBed.inject(
            ProgramService,
        ) as jasmine.SpyObj<ProgramService>;
        fixture = TestBed.createComponent(ProgramWorkspaceComponent);
        component = fixture.componentInstance;
        Blockly.registry.unregister("theme", "customtheme");
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should update the workspace content when route params are changed", () => {
        const selectedProgram = new Program("name-1", {testfield: "1"}, "id-1");
        programService.getProgramFromCache.and.returnValue(selectedProgram);
        const spyOnWorkspace = spyOnProperty(
            fixture.componentRef.instance,
            "workspaceContent",
            "set",
        );
        params.next({uuid: "id-1"});
        expect(programService.getProgramFromCache).toHaveBeenCalledWith("id-1");
        expect(spyOnWorkspace).toHaveBeenCalledOnceWith(
            selectedProgram.program,
        );
    });

    it("should save the program", () => {
        const selectedProgram = new Program("name-1", {testfield: "2"}, "id-1");
        const expectedProgram = new Program("name-1", {testfield: "1"}, "id-1");
        programService.getProgramFromCache.and.returnValue(selectedProgram);
        const spyOnWorkspace = spyOnProperty(
            fixture.componentRef.instance,
            "workspaceContent",
            "get",
        ).and.returnValue({testfield: "1"});
        component.saveProgram();
        expect(spyOnWorkspace).toHaveBeenCalled();
        expect(programService.getProgramFromCache).toHaveBeenCalledWith("id-1");
        expect(
            programService.updateProgramByProgramNumber,
        ).toHaveBeenCalledOnceWith(expectedProgram);
    });
});
