import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramWorkspaceComponent} from "./program-workspace.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {ActivatedRoute, Params} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {Program} from "src/app/shared/types/program";
import * as Blockly from "blockly";
import {pythonGenerator} from "blockly/python";

describe("ProgramWorkspaceComponent", () => {
    let component: ProgramWorkspaceComponent;
    let fixture: ComponentFixture<ProgramWorkspaceComponent>;
    let programService: jasmine.SpyObj<ProgramService>;
    let params: BehaviorSubject<Params>;
    beforeEach(async () => {
        const programServiceSpy: jasmine.SpyObj<ProgramService> =
            jasmine.createSpyObj("ProgramService", [
                "getProgramFromCache",
                "getAllPrograms",
                "getProgramByProgramNumber",
                "createProgram",
                "updateProgramByProgramNumber",
                "deleteProgramByProgramNumber",
                "getCodeByProgramNumber",
                "updateCodeByProgramNumber",
            ]);

        programServiceSpy.getAllPrograms.and.returnValue(
            new BehaviorSubject([
                new Program("name-0", "id-0"),
                new Program("name-1", "id-1"),
                new Program("name-2", "id-2"),
            ]),
        );
        programServiceSpy.viewModeSubject = new BehaviorSubject(false);
        programServiceSpy.pythonCodeSubject = new BehaviorSubject("");

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
        programService.getCodeByProgramNumber.and.returnValue(
            new BehaviorSubject({
                visual: '{"testfield": 1}',
            }),
        );
        const spyOnWorkspace = spyOnProperty(
            fixture.componentRef.instance,
            "workspaceContent",
            "set",
        );
        params.next({uuid: "id-1"});
        expect(programService.getCodeByProgramNumber).toHaveBeenCalledWith(
            "id-1",
        );
        expect(spyOnWorkspace).toHaveBeenCalledOnceWith({testfield: 1});
    });

    it("should save the code", () => {
        spyOnProperty(
            fixture.componentRef.instance,
            "workspaceContent",
            "get",
        ).and.returnValue({testfield: "1"});
        spyOn(pythonGenerator, "workspaceToCode").and.returnValue(
            'print("test")',
        );
        const expectedCode = {
            visual: '{"testfield":"1"}',
            python: 'print("test")',
        };
        component.saveCode();
        expect(
            programService.updateCodeByProgramNumber,
        ).toHaveBeenCalledOnceWith("id-1", expectedCode);
    });

    it("generateCode should return when workspace.isDragging is true", () => {
        const isDraggingSpy = spyOn(
            component.workspace,
            "isDragging",
        ).and.returnValue(true);
        const supportedEventsSpy = spyOn(component.supportedEvents, "has");
        const event = new Blockly.Events.BubbleOpen();
        component.generateCode(event);
        expect(isDraggingSpy).toHaveBeenCalled();
        expect(supportedEventsSpy).not.toHaveBeenCalled();
    });

    it("generateCode should return when event-type is not of supportedEvents", () => {
        const isDraggingSpy = spyOn(
            component.workspace,
            "isDragging",
        ).and.returnValue(false);
        const supportedEventsSpy = spyOn(
            component.supportedEvents,
            "has",
        ).and.callThrough();
        const codeGeneratorSpy = spyOn(pythonGenerator, "workspaceToCode");
        const event = new Blockly.Events.BubbleOpen();
        component.generateCode(event);
        expect(isDraggingSpy).toHaveBeenCalled();
        expect(supportedEventsSpy).toHaveBeenCalled();
        expect(codeGeneratorSpy).not.toHaveBeenCalled();
    });

    it("generateCode should generate pythoncode", () => {
        const isDraggingSpy = spyOn(
            component.workspace,
            "isDragging",
        ).and.returnValue(false);
        const supportedEventsSpy = spyOn(
            component.supportedEvents,
            "has",
        ).and.callThrough();
        const codeGeneratorSpy = spyOn(pythonGenerator, "workspaceToCode");
        const pythonCodeSubjectSpy = spyOn(
            programService.pythonCodeSubject,
            "next",
        );
        const event = new Blockly.Events.BlockChange();
        component.generateCode(event);
        expect(isDraggingSpy).toHaveBeenCalled();
        expect(supportedEventsSpy).toHaveBeenCalled();
        expect(codeGeneratorSpy).toHaveBeenCalled();
        expect(pythonCodeSubjectSpy).toHaveBeenCalled();
    });

    it("should change the viewMode to normal view if splitscreenMode is true ", () => {
        const viewModeSubjectSpy = spyOn(
            programService.viewModeSubject,
            "next",
        );
        component.splitscreenMode = true;
        component.changeViewMode();
        expect(component.splitscreenMode).toBe(false);
        expect(viewModeSubjectSpy).toHaveBeenCalledWith(false);
    });

    it("should change the viewMode to splitscreen if splitscreenMode is false ", () => {
        const viewModeSubjectSpy = spyOn(
            programService.viewModeSubject,
            "next",
        );
        component.splitscreenMode = false;
        component.changeViewMode();
        expect(component.splitscreenMode).toBe(true);
        expect(viewModeSubjectSpy).toHaveBeenCalledWith(true);
    });
});
