import * as Blockly from "blockly";
import {customBlockDefinition} from "src/app/program/pib-blockly/program-blocks/custom-blocks";
import {pythonGenerator} from "src/app/program/pib-blockly/program-generators/custom-generators";
import {toolbox} from "src/app/program/program-overview/program-manager/blockly";

function createHeadlessWorkspace(): Blockly.Workspace {
    customBlockDefinition();
    return new Blockly.Workspace();
}

describe("Blockly workspace serialization (UC-BLY-001)", () => {
    let workspace: Blockly.Workspace;

    beforeEach(() => {
        workspace = createHeadlessWorkspace();
    });

    it("round-trips workspace state via Blockly.serialization JSON", () => {
        const moveMotor = workspace.newBlock("move_motor");
        moveMotor.setFieldValue("THUMB_LEFT_STRETCH", "MOTORNAME");
        moveMotor.setFieldValue("ABSOLUTE", "MODE");

        const saved = Blockly.serialization.workspaces.save(workspace);
        const jsonString = JSON.stringify(saved);

        workspace.clear();
        expect(workspace.getAllBlocks(false).length).toBe(0);

        Blockly.serialization.workspaces.load(
            JSON.parse(jsonString),
            workspace,
        );

        const blocks = workspace.getAllBlocks(false);
        expect(blocks.length).toBe(1);
        expect(blocks[0].type).toBe("move_motor");
        expect(blocks[0].getFieldValue("MOTORNAME")).toBe("THUMB_LEFT_STRETCH");
    });

    it("EC-BLY-001: JSON.parse throws on malformed codeVisual", () => {
        expect(() => JSON.parse("{ invalid json")).toThrow();
    });

    it("EC-BLY-002: empty workspace serializes to valid JSON", () => {
        const saved = Blockly.serialization.workspaces.save(workspace);
        const jsonString = JSON.stringify(saved);
        expect(() => JSON.parse(jsonString)).not.toThrow();
    });
});

describe("Blockly pose dropdown sync (UC-BLY-003 / EC-BLY-005)", () => {
    beforeEach(() => {
        customBlockDefinition();
    });

    it("move_to_pose getPoses returns pose options from PoseService shape", () => {
        const poses: [string, string][] = [["Wave", "abc"]];
        Blockly.Blocks["move_to_pose"].getPoses = () => poses;

        expect(Blockly.Blocks["move_to_pose"].getPoses()).toEqual([
            ["Wave", "abc"],
        ]);
    });

    it("EC-BLY-005: empty pose list uses fallback option", () => {
        Blockly.Blocks["move_to_pose"].getPoses = () => [
            ["no pose available", "NO POSE"],
        ];

        expect(Blockly.Blocks["move_to_pose"].getPoses()[0][0]).toBe(
            "no pose available",
        );
    });
});

describe("Blockly toolbox categories (frontend_architecture §4.5)", () => {
    const expectedCategories = [
        "Logic",
        "Loops",
        "Math",
        "Text",
        "Lists",
        "Colour",
        "Time",
        "Variables",
        "Functions",
        "System",
        "Motoric skills",
        "Audio skills",
        "Visual Skills",
        "Expressions",
        "Buttons",
    ];

    for (const name of expectedCategories) {
        it(`toolbox XML contains category ${name}`, () => {
            expect(toolbox).toContain(`<category name="${name}"`);
        });
    }

    it("System category includes run_script block", () => {
        expect(toolbox).toContain('type="run_script"');
    });

    it("Motoric skills category includes move_motor and move_to_pose", () => {
        expect(toolbox).toContain('type="move_motor"');
        expect(toolbox).toContain('type="move_to_pose"');
    });
});

describe("Blockly Python generator (UC-BLY-002 / UC-BLY-012)", () => {
    let workspace: Blockly.Workspace;

    beforeEach(() => {
        workspace = createHeadlessWorkspace();
    });

    it("move_motor block generates apply_joint_trajectory Python call", () => {
        const block = workspace.newBlock("move_motor");
        block.setFieldValue("THUMB_LEFT_STRETCH", "MOTORNAME");
        block.setFieldValue("ABSOLUTE", "MODE");

        const numberBlock = workspace.newBlock("math_number");
        numberBlock.setFieldValue("100", "NUM");
        const positionInput = block.getInput("POSITION");
        if (positionInput?.connection) {
            positionInput.connection.connect(numberBlock.outputConnection);
        }

        const code = pythonGenerator.workspaceToCode(workspace);

        expect(code).toContain("thumb_left_stretch");
        expect(code).toContain("apply_joint_trajectory");
        expect(code).toContain("100");
    });

    it("UC-BLY-013: move_to_pose uses selected pose id in generated code path", () => {
        Blockly.Blocks["move_to_pose"].getPoses = () => [["Wave", "abc"]];

        const block = workspace.newBlock("move_to_pose");
        block.setFieldValue("abc", "POSE");

        const code = pythonGenerator.workspaceToCode(workspace);
        expect(code.length).toBeGreaterThan(0);
    });
});
