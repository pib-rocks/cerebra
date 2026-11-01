import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ProgramWorkspaceComponent} from "./program-workspace.component";
import * as Blockly from "blockly";
import {SimpleChange} from "@angular/core";
import {PoseService} from "src/app/shared/services/pose.service";
import {BehaviorSubject, Subject} from "rxjs";
import {Pose} from "src/app/shared/types/pose";

describe("ProgramWorkspaceComponent", () => {
    let component: ProgramWorkspaceComponent;
    let poseService: jasmine.SpyObj<PoseService>;
    let fixture: ComponentFixture<ProgramWorkspaceComponent>;
    const poseSubject = new Subject<Pose[]>();

    beforeEach(async () => {
        const poseServiceSpy: jasmine.SpyObj<PoseService> =
            jasmine.createSpyObj("PoseService", [
                "getPosesObservable",
                "applyPose",
            ]);

        await TestBed.configureTestingModule({
            imports: [ProgramWorkspaceComponent],
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

    it("should update move_to_pose dropdown options in place without overwriting unsaved workspace blocks", () => {
        const block = component.workspace.newBlock("move_to_pose");
        block.setFieldValue("pose-head-up", "POSE");

        poseSubject.next([
            new Pose("Startup/Resting", "pose-rest", false),
            new Pose("Head up", "pose-head-up", true),
        ]);

        const blocksAfter = component.workspace.getAllBlocks(false);
        expect(blocksAfter.length).toBe(1);
        expect(blocksAfter[0].getFieldValue("POSE")).toBe("pose-head-up");
        expect(blocksAfter[0].getField("POSE")?.getText()).toBe("Head up");
    });

    it("should define move_to_pose before the initial synchronous pose emission", () => {
        delete Blockly.Blocks["move_to_pose"];
        poseService.getPosesObservable.and.returnValue(
            new BehaviorSubject<Pose[]>([
                new Pose("Startup/Resting", "pose-rest", false),
            ]),
        );

        const freshFixture = TestBed.createComponent(ProgramWorkspaceComponent);
        expect(() => freshFixture.detectChanges()).not.toThrow();
        expect(Blockly.Blocks["move_to_pose"].getPoses()).toEqual([
            ["Startup/Resting", "pose-rest"],
        ]);
        freshFixture.destroy();
    });

    it("should update all dynamic pose dropdown rows on play_pose_sequence blocks", () => {
        const block = component.workspace.newBlock(
            "play_pose_sequence",
        ) as Blockly.Block & {
            insertStepAt?: (
                index: number,
                pose?: string,
                duration?: number,
            ) => void;
        };
        if (block.getField("POSE_0")) {
            block.setFieldValue("pose-w1", "POSE_0");
        }
        if (block.getField("POSE_1")) {
            block.setFieldValue("pose-w2", "POSE_1");
        }
        block.insertStepAt?.(1, "pose-mid", 1.2);

        poseSubject.next([
            new Pose("Wave 1", "pose-w1", false),
            new Pose("Middle Pose", "pose-mid", false),
            new Pose("Wave 2", "pose-w2", false),
        ]);

        if (block.getField("POSE_0")) {
            expect(block.getFieldValue("POSE_0")).toBe("pose-w1");
            expect(block.getField("POSE_0")?.getText()).toBe("Wave 1");
        }
        if (block.getField("POSE_1")) {
            expect(block.getFieldValue("POSE_1")).toBe("pose-mid");
            expect(block.getField("POSE_1")?.getText()).toBe("Middle Pose");
        }
        if (block.getField("POSE_2")) {
            expect(block.getFieldValue("POSE_2")).toBe("pose-w2");
            expect(block.getField("POSE_2")?.getText()).toBe("Wave 2");
        }
    });
});
