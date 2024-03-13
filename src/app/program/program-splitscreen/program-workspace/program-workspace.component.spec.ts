import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramWorkspaceComponent} from "./program-workspace.component";
import * as Blockly from "blockly";
import {SimpleChange} from "@angular/core";

describe("ProgramWorkspaceComponent", () => {
    let component: ProgramWorkspaceComponent;
    let fixture: ComponentFixture<ProgramWorkspaceComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProgramWorkspaceComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramWorkspaceComponent);
        component = fixture.componentInstance;
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

    it("should emit the new flyout wdith if content open", () => {
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
