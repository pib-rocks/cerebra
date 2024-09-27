import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramWorkspaceComponent} from "./program-workspace.component";
import * as Blockly from "blockly";
import {SimpleChange} from "@angular/core";
import {PoseService} from "src/app/shared/services/pose.service";
import {Subject} from "rxjs";
import {Pose} from "src/app/shared/types/pose";

describe("ProgramWorkspaceComponent", () => {
    let component: ProgramWorkspaceComponent;
    let poseService: jasmine.SpyObj<PoseService>;
    let fixture: ComponentFixture<ProgramWorkspaceComponent>;
    let poseSubject = new Subject<Pose[]>();

    beforeEach(async () => {
        const poseServiceSpy: jasmine.SpyObj<PoseService> =
            jasmine.createSpyObj("PoseService", [
                "getPosesObservable",
                "applyPose",
            ]);

        await TestBed.configureTestingModule({
            declarations: [ProgramWorkspaceComponent],
            providers: [
                {
                    provide: PoseService,
                    useValue: poseServiceSpy,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramWorkspaceComponent);
        component = fixture.componentInstance;
        poseService = TestBed.inject(
            PoseService,
        ) as jasmine.SpyObj<PoseService>;
        poseService.getPosesObservable.and.returnValue(poseSubject);
        Blockly.registry.unregister("theme", "customtheme");
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should update the visual code and emit python code", () => {
        const currentCodeVisual = '{"a":1}';
        const previousCodeVisual = '{"a":2}';
        const codePython = "print('hi')";
        const codePythonEmitSpy = spyOn(component.codePythonChange, "emit");
        const codePythonSpy = spyOnProperty(
            component,
            "codePython",
            "get",
        ).and.returnValue(codePython);
        const codeVisualSpy = spyOnProperty(
            component,
            "workspaceContent",
            "set",
        );
        component.ngOnChanges({
            codeVisual: new SimpleChange(
                previousCodeVisual,
                currentCodeVisual,
                false,
            ),
        });
        expect(codeVisualSpy).toHaveBeenCalledWith(currentCodeVisual);
        expect(codePythonSpy).toHaveBeenCalled();
        expect(codePythonEmitSpy).toHaveBeenCalledOnceWith(codePython);
    });

    it("should neither update the visual code nor emit python code", () => {
        const currentCodeVisual = '{"a":1}';
        const previousCodeVisual = '{"a":2}';
        const codePython = "print('hi')";
        const codePythonEmitSpy = spyOn(component.codePythonChange, "emit");
        const codePythonSpy = spyOnProperty(
            component,
            "codePython",
            "get",
        ).and.returnValue(codePython);
        const codeVisualSpy = spyOnProperty(
            component,
            "workspaceContent",
            "set",
        );
        component.ngOnChanges({
            codeVisual: new SimpleChange(
                previousCodeVisual,
                currentCodeVisual,
                true,
            ),
        });
        expect(codeVisualSpy).not.toHaveBeenCalled();
        expect(codePythonSpy).not.toHaveBeenCalled();
        expect(codePythonEmitSpy).not.toHaveBeenCalled();
    });

    it("should emit the new flyout width if content open", () => {
        spyOn(component.workspace.trashcan!, "contentsIsOpen").and.returnValue(
            true,
        );
        spyOn(
            component.workspace.trashcan!.flyout!,
            "getWidth",
        ).and.returnValue(100);
        const flyoutChangeSpy = spyOn(component.trashcanFlyoutChange, "emit");
        component.flyoutChangeCallback();
        expect(flyoutChangeSpy).toHaveBeenCalledOnceWith(100);
    });

    it("should emit width 0 if content not open", () => {
        spyOn(component.workspace.trashcan!, "contentsIsOpen").and.returnValue(
            false,
        );
        spyOn(
            component.workspace.trashcan!.flyout!,
            "getWidth",
        ).and.returnValue(100);
        const flyoutChangeSpy = spyOn(component.trashcanFlyoutChange, "emit");
        component.flyoutChangeCallback();
        expect(flyoutChangeSpy).toHaveBeenCalledOnceWith(0);
    });
});
